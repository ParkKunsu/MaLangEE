from __future__ import annotations

import json
import sys
from pathlib import Path

from typing import List, Optional

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db import models
from app.db.database import get_db
from app.schemas.scenario import ScenarioResponse
from websockets.exceptions import ConnectionClosedOK

AI_ENGINE_ROOT = Path(__file__).resolve().parents[4] / "ai-engine"
if str(AI_ENGINE_ROOT) not in sys.path:
    sys.path.append(str(AI_ENGINE_ROOT))

from scenario.realtime_bridge import handle_client

router = APIRouter()


@router.get("/", response_model=List[ScenarioResponse], summary="전체 시나리오 목록 조회 (메뉴판)")
async def get_scenarios(
    db: AsyncSession = Depends(get_db),
    # Optional: Pagination
):
    """
    정의된 모든 시나리오 목록을 조회합니다.
    """
    stmt = select(models.ScenarioDefinition)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{scenario_id}", response_model=ScenarioResponse, summary="시나리오 상세 조회")
async def get_scenario_detail(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    특정 시나리오의 상세 정보를 조회합니다.
    """
    stmt = select(models.ScenarioDefinition).where(models.ScenarioDefinition.id == scenario_id)
    result = await db.execute(stmt)
    scenario = result.scalars().first()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    return scenario


@router.post("/", response_model=ScenarioResponse, summary="새 시나리오 등록 (Admin)")
async def create_scenario(
    scenario_in: ScenarioResponse, # Request Body는 Create Schema 사용 권장되나, 여기선 구조 동일하므로 Response/Base 등 유연하게 처리
    db: AsyncSession = Depends(get_db),
):
    """
    새로운 시나리오(메뉴)를 등록합니다.
    """
    # 1. 중복 확인
    stmt = select(models.ScenarioDefinition).where(models.ScenarioDefinition.id == scenario_in.id)
    result = await db.execute(stmt)
    if result.scalars().first():
         raise HTTPException(status_code=400, detail="Scenario ID already exists")
    
    # 2. 저장
    scenario_obj = models.ScenarioDefinition(
        id=scenario_in.id,
        title=scenario_in.title,
        description=scenario_in.description,
        place=scenario_in.place,
        partner=scenario_in.partner,
        goal=scenario_in.goal,
        level=scenario_in.level,
        category=scenario_in.category
    )
    db.add(scenario_obj)
    await db.commit()
    await db.refresh(scenario_obj)
    
    return scenario_obj


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
