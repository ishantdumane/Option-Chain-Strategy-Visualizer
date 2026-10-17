import sys
import json
import sys
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

"""
strategy description:
input: minute candle data, expiry

1. considers trading the contract from 20 days before the expiry
2. stops trading 2 days before expiry

"""

def date_x_days_before(date_str, x):
    # Convert to datetime object
    given_date = datetime.strptime(date_str, "%Y-%m-%d")

    x_days_before = given_date - relativedelta(days=x)

    # Check if the date falls on a weekend
    weekday = x_days_before.weekday()  # 0=Monday, 5=Saturday, 6=Sunday
    
    if weekday == 5:  # Saturday
        x_days_before = x_days_before - relativedelta(days=1)  # Go back 1 day to Friday
    elif weekday == 6:  # Sunday
        x_days_before = x_days_before - relativedelta(days=2)  # Go back 2 days to Friday

    # Format back to string
    result = x_days_before.strftime("%Y-%m-%d")

    return result

def main():
    # 1. Read stdin (all at once)
    raw_input = sys.stdin.read()
    # 2. Parse JSON input
    try:
        input_data = json.loads(raw_input)
        candles = input_data["candles"]
        expiry = input_data["expiry"]

        markersData = []

        trade_num = 0
        epsilon = 0.1
        first_date = date_x_days_before(expiry, 20)         # first date refers to the date from where we want to consider trading into the options. the previous we choose to ignore beacuse of the liquidity issues
        datetime_format1 = "%Y-%m-%dT%H:%M:%S%z"
        datetime_format2 = "%Y-%m-%d"
        first_date_obj = datetime.strptime(first_date, datetime_format2).date()
        expiry_date_obj = datetime.strptime(expiry, datetime_format2).date()
        last_date_obj = expiry_date_obj - timedelta(days=2)
        low_target = 0
        prev_low = 0
        set_prev_low = 1
        position = 0        # 0 for no position, 1 for 1 long position
        target = 0
        tr = 0.5            # target return
        loss = 0
        lr = 0.5            # loss return
        candle_num = 0      # number of candles iterated since the most recent action (buy/sell)
        for candle in candles:
            candle_num+=1
            time = candle[0]
            price = candle[4]
            curr_date_obj = datetime.strptime(time, datetime_format1).date()
            
            if curr_date_obj <= first_date_obj:
                if curr_date_obj == first_date_obj:
                    if set_prev_low:
                        prev_low = price
                        set_prev_low = 0
                    elif price < prev_low:
                        prev_low = price
                        low_target = prev_low - epsilon * prev_low
                    else:
                        pass
                    
            else:
                if set_prev_low:
                    first_date_obj = curr_date_obj
                    prev_low = price
                    set_prev_low = 0

                if curr_date_obj <= last_date_obj and price <= low_target and position == 0:
                    position = 1
                    markersData.append([time, price])
                    target = (1 + tr) * price
                    loss = (1 - lr) * price
                    candle_num = 1
                elif position == 1 and (price >= target or price <= loss or (candle_num >= 375*2 and time[11:16] == "15:29")):
                    position = 0
                    if price < prev_low:
                        prev_low = price
                    low_target = prev_low - epsilon * prev_low
                    markersData.append([time, price])
                    trade_num+=1
                    candle_num = 0
                else:
                    pass
            
                if price < prev_low:
                    prev_low = price

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
