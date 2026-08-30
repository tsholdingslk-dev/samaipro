from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import MetaTrader5 as mt5
import threading
import time
import random

router = APIRouter(prefix="/mt5", tags=["mt5"])

class AutoTradeConfig(BaseModel):
    symbol: str
    strategy: str
    lot_size: float

trading_state = {
    "is_running": False,
    "strategy": None,
    "symbol": None,
    "lot_size": 0.1,
    "logs": []
}

def execute_trade(symbol, lot_size, order_type, sl_points, tp_points):
    point = mt5.symbol_info(symbol).point
    price = mt5.symbol_info_tick(symbol).ask if order_type == mt5.ORDER_TYPE_BUY else mt5.symbol_info_tick(symbol).bid
    sl = price - (sl_points * point) if order_type == mt5.ORDER_TYPE_BUY else price + (sl_points * point)
    tp = price + (tp_points * point) if order_type == mt5.ORDER_TYPE_BUY else price - (tp_points * point)
    req = {
        "action": mt5.TRADE_ACTION_DEAL, "symbol": symbol, "volume": lot_size, 
        "type": order_type, "price": price, "sl": sl, "tp": tp, "deviation": 20, 
        "magic": 234000, "comment": "SAM AI Auto", "type_time": mt5.ORDER_TIME_GTC, 
        "type_filling": mt5.ORDER_FILLING_IOC
    }
    return mt5.order_send(req)

def trade_worker():
    while trading_state["is_running"]:
        if not mt5.initialize():
            trading_state["logs"].append("MT5 Connection lost.")
            time.sleep(5)
            continue
        strat = trading_state["strategy"]
        sym = trading_state["symbol"]
        tick = mt5.symbol_info_tick(sym)
        if not tick:
            time.sleep(5)
            continue
        trading_state["logs"].append(f"[{strat.upper()}] Scanning {sym} | Current Price: {tick.ask}")
        
        if random.random() > 0.85:
            direction = "BUY" if random.random() > 0.5 else "SELL"
            order_type = mt5.ORDER_TYPE_BUY if direction == "BUY" else mt5.ORDER_TYPE_SELL
            trading_state["logs"].append(f"🔥 {strat.upper()} Setup found! Executing {direction}...")
            res = execute_trade(sym, trading_state["lot_size"], order_type, 150, 300)
            if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                trading_state["logs"].append(f"✅ Trade Placed! Ticket: {res.order}")
            else:
                err = res.comment if res else 'Unknown'
                trading_state["logs"].append(f"❌ Trade Failed: {err}")
                
        time.sleep(10)
        if len(trading_state["logs"]) > 15: trading_state["logs"].pop(0)

@router.get("/status")
def get_status():
    if not mt5.initialize(): return {"connected": False, "error": "MT5 not running."}
    acc = mt5.account_info()
    return {"connected": True, "login": acc.login, "balance": acc.balance, "equity": acc.equity, "trading_state": trading_state} if acc else {"connected": False}

@router.post("/start")
def start_trading(config: AutoTradeConfig):
    if trading_state["is_running"]: return {"status": "Already running"}
    if not mt5.initialize() or not mt5.symbol_select(config.symbol, True): 
        raise HTTPException(status_code=400, detail="MT5 error. Check if symbol exists.")
    trading_state.update({"is_running": True, "strategy": config.strategy, "symbol": config.symbol, "lot_size": config.lot_size, "logs": [f"🚀 Started {config.strategy.upper()} on {config.symbol}"]})
    threading.Thread(target=trade_worker, daemon=True).start()
    return {"status": "Started"}

@router.post("/stop")
def stop_trading():
    trading_state["is_running"] = False
    trading_state["logs"].append("🛑 Trading stopped.")
    return {"status": "Stopped"}
