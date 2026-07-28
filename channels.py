# Ground-truth channel parameters for the ad-spend simulator.
# These values are hidden from the agent — it only ever sees simulated
# results (spend, clicks, conversions), never these underlying numbers.
CHANNELS = {
    "search": {
        "cpc": 2.50,          # pricey, reliable, scales
        "conv_rate": 0.08,
        "saturation": 250,
        "noise": 0.10,
    },
    "meta": {
        "cpc": 1.20,          # solid workhorse
        "conv_rate": 0.04,
        "saturation": 180,
        "noise": 0.15,
    },
    "tiktok": {
        "cpc": 0.40,          # cheap clicks, saturates fast — trap
        "conv_rate": 0.015,
        "saturation": 90,
        "noise": 0.25,
    },
    "display": {
        "cpc": 0.80,          # obvious loser
        "conv_rate": 0.008,
        "saturation": 300,
        "noise": 0.12,
    },
}
