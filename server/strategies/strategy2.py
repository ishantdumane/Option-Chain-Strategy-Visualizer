from datetime import datetime, timedelta
from collections import deque
import sys
import json

"""
strategy description:
input: minute candle data, expiry

1. considers trading the contract from 20 days before the expiry
2. stops trading 2 days before expiry
3. enters the trade once the price is less than 10% of that of the lowest price in the last 375 candles
4. exits if the target/loss is hit or the trade is open for more than 2 days 
"""

def date_x_days_before(date_str, x):
    # Convert to datetime object
    given_date = datetime.fromisoformat(date_str).date()

    x_days_before = given_date - timedelta(days=x)

    # Check if the date falls on a weekend
    weekday = x_days_before.weekday()  # 0=Monday, 5=Saturday, 6=Sunday
    
    if weekday == 5:  # Saturday
        x_days_before = x_days_before - timedelta(days=1)  # Go back 1 day to Friday
    elif weekday == 6:  # Sunday
        x_days_before = x_days_before - timedelta(days=2)  # Go back 2 days to Friday

    # Return in datetime.date() format
    result = x_days_before

    return result

def main():
    # 1. Read stdin (all at once)
    raw_input = sys.stdin.read()
    # 2. Parse JSON input
    try:
        input_data = json.loads(raw_input)
        candles = input_data["candles"]
        expiry = input_data["expiry"]

        tr=1.55
        lr=0.15
        epsilon=0.1

        expiry_date_obj = datetime.fromisoformat(expiry).date()
        first_date_obj = expiry_date_obj - timedelta(days=4)
        last_date_obj = expiry_date_obj - timedelta(days=2)
        max_trade_period = 750
        buy_target = 0
        prev_low = 0
        set_prev_low = 1
        position = 0        # 0 for no position, 1 for 1 long position
        target = 0
        # tr = 0.5            # target return
        loss = 0
        # lr = 0.5            # loss return
        # epsilon = 0.1
        candle_num = 0      # number of candles iterated since the most recent action (buy/sell)
        trade_num = 0
        processed_candles = [
            (c[0], datetime.fromisoformat(c[0]).date(), c[4], c[5], c[6])
            for c in candles
        ]
        enter_time = 0
        enter_price = 0
        enter_vol = 0
        enter_OI = 0
        markersData = []
        recent_prices = deque([])
        recent_nums = 90
        min_num_count = 0
        for time_stamp, curr_date_obj, price, vol, OI in processed_candles:
            candle_num+=1
            
            if curr_date_obj <= first_date_obj:
                if curr_date_obj == first_date_obj:
                    if set_prev_low:
                        prev_low = price
                        set_prev_low = 0
                    elif price < prev_low:
                        prev_low = price
                        buy_target = prev_low * (1 - epsilon)
                    else:
                        pass
            else:

                if set_prev_low:
                    first_date_obj = curr_date_obj
                    prev_low = price
                    set_prev_low = 0

                if price <= buy_target and position == 0:
                    position = 1
                    enter_time = time_stamp
                    enter_price = price
                    enter_vol = vol
                    enter_OI = OI
                    candle_num = 1
                    markersData.append([time_stamp, price])
                    target = (1 + tr) * price
                    loss = (1 - lr) * price
                elif position == 1 and (price >= target or price <= loss or (candle_num >= max_trade_period and time_stamp[11:16] == "15:29")):
                    position = 0
                    # if price < prev_low:
                    #     prev_low = price
                    buy_target = prev_low - epsilon * prev_low
                    markersData.append([time_stamp, price])
                    trade_num+=1
                    candle_num = 0
                else:
                    pass

                recent_prices.append(price)
                if prev_low>price:
                    prev_low=price
                    min_num_count = 0
                min_num_count+=1
                if len(recent_prices) < recent_nums:
                    continue
                recent_prices.popleft()
                if min_num_count == recent_nums+1:
                    prev_low = min(recent_prices)
                    min_num_count = recent_nums - recent_prices.index(prev_low)

                buy_target = prev_low
        
        if position == 1:
            markersData.append([processed_candles[-1][0],processed_candles[-1][2]])
    
    except:
        # If input is not valid JSON, print error in JSON format
        print(json.dumps({
            "error": "Something went wrong in the python script",
            "candles": candles,
            "expiry": expiry,
            "markersData": markersData
        }))
        return

    # 3. Do some processing (replace with your strategy logic)
    result = {
        "message": "Hello from Python!, No errors encountered in python",
        "markersData": markersData
    }

    # 4. Output result as JSON to stdout
    print(json.dumps(result))

if __name__ == "__main__":
    main()

