from __future__ import annotations

from typing import Any, Callable, Optional

from .scenario_builder import ScenarioBuilder

SendResponse = Callable[[str], Any]
OnComplete = Callable[[ScenarioBuilder], Any]


class RealtimeScenarioPipeline:
    def __init__(
        self,
        builder: ScenarioBuilder,
        send_response: SendResponse,
        *,
        max_attempts: int = 3,
        on_complete: Optional[OnComplete] = None,
        send_final_response: bool = True,
    ) -> None:
        self._builder = builder
        self._send_response = send_response
        self._max_attempts = max_attempts
        self._on_complete = on_complete
        self._send_final_response = send_final_response

    async def handle_event(self, event: dict[str, Any]) -> None:
        if self._builder.state.completed:
            return
        user_text = self._extract_user_text(event)
        if not user_text:
            return

        self._builder.ingest_user_text(user_text)
        if self._builder.state.is_complete():
            if self._send_final_response:
                await self._maybe_await(self._send_response(self._builder.finalize_scenario()))
            if self._on_complete:
                await self._maybe_await(self._on_complete(self._builder))
            return

        question = self._builder.build_follow_up_question()
        if question is None:
            if self._builder.state.attempts >= self._max_attempts:
                if self._send_final_response:
                    await self._maybe_await(self._send_response(self._builder.finalize_with_fallback()))
            else:
                if self._send_final_response:
                    await self._maybe_await(self._send_response(self._builder.finalize_scenario()))
            if self._on_complete:
                await self._maybe_await(self._on_complete(self._builder))
            return

        await self._maybe_await(self._send_response(question))

    def _extract_user_text(self, event: dict[str, Any]) -> Optional[str]:
        event_type = event.get("type", "")

        # Typical Realtime user transcription event.
        if event_type in (
            "input_audio_buffer.transcription.completed",
            "conversation.item.input_audio_transcription.completed",
        ):
            transcript = event.get("transcript")
            if isinstance(transcript, str):
                return transcript.strip()

        # Generic conversation item event (user role only).
        if "conversation.item" in event_type:
            item = event.get("item", {})
            if item.get("role") != "user":
                return None
            text = self._extract_text_from_content(item.get("content"))
            if text:
                return text

        # Avoid treating model transcripts as user text.
        if event_type.startswith("response."):
            return None
        return None

    @staticmethod
    def _extract_text_from_content(content: Any) -> Optional[str]:
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            for part in content:
                if isinstance(part, dict):
                    if part.get("type") in ("text", "input_text"):
                        text = part.get("text")
                        if isinstance(text, str) and text.strip():
                            return text.strip()
                    if "text" in part and isinstance(part["text"], str):
                        return part["text"].strip()
        if isinstance(content, dict):
            text = content.get("text")
            if isinstance(text, str):
                return text.strip()
        return None

    @staticmethod
    async def _maybe_await(result: Any) -> None:
        if hasattr(result, "__await__"):
            await result
