from __future__ import annotations

import json
import sys
from pathlib import Path

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from app.api import deps
from app.db import models
from websockets.exceptions import ConnectionClosedOK

AI_ENGINE_ROOT = Path(__file__).resolve().parents[4] / "ai-engine"
if str(AI_ENGINE_ROOT) not in sys.path:
    sys.path.append(str(AI_ENGINE_ROOT))

from scenario.realtime_bridge import handle_client

router = APIRouter()


class FastAPIWebSocketAdapter:
    def __init__(self, websocket: WebSocket) -> None:
        self.websocket = websocket

    @property
    def remote_address(self):
        client = self.websocket.client
        if client is None:
            return None
        return (client.host, client.port)

    async def send(self, data: str) -> None:
        await self.websocket.send_text(data)

    def __aiter__(self):
        return self

    async def __anext__(self) -> str:
        try:
            return await self.websocket.receive_text()
        except WebSocketDisconnect:
            raise StopAsyncIteration


@router.websocket("/ws/scenario")
async def websocket_scenario(
    websocket: WebSocket,
    user: models.User = Depends(deps.get_current_user_ws),
) -> None:
    await websocket.accept()
    adapter = FastAPIWebSocketAdapter(websocket)
    try:
        await handle_client(adapter, user_id=user.id)
    except (WebSocketDisconnect, ConnectionClosedOK):
        return
    except RuntimeError as exc:
        await websocket.send_text(json.dumps({"type": "error", "message": str(exc)}))
        await websocket.close(code=1011, reason="Server configuration error")


@router.websocket("/ws/guest-scenario")
async def websocket_guest_scenario(websocket: WebSocket) -> None:
    await websocket.accept()
    adapter = FastAPIWebSocketAdapter(websocket)
    try:
        await handle_client(adapter, user_id=None)
    except (WebSocketDisconnect, ConnectionClosedOK):
        return
    except RuntimeError as exc:
        await websocket.send_text(json.dumps({"type": "error", "message": str(exc)}))
        await websocket.close(code=1011, reason="Server configuration error")
