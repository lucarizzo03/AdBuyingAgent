import random

from channels import CHANNELS

# NOTE: the future agent only ever sees simulate()'s OUTPUT (spend, clicks,
# conversions, cpa) — it never has access to CHANNELS' hidden params.


def effective_spend(spend: float, saturation: float) -> float:
    """Dollars past `saturation` only convert to working spend at 40% efficiency."""
    if spend <= saturation:
        return spend
    return saturation + (spend - saturation) * 0.4


def jitter(noise: float) -> float:
    """Random daily multiplier in [1 - noise, 1 + noise]."""
    return random.uniform(1 - noise, 1 + noise)


def simulate(allocations: dict[str, float], day: int) -> dict:
    """Simulate one day of ad spend across channels using CHANNELS' hidden params."""
    results = {}
    for channel, spend in allocations.items():
        params = CHANNELS[channel]
        cpc = params["cpc"]
        saturation = params["saturation"]
        noise = params["noise"]

        # scripted event: from day 20 on, meta's algorithm change halves its
        # conversion rate; applied locally so CHANNELS stays untouched
        conv_rate = params["conv_rate"]
        if channel == "meta" and day >= 20:
            conv_rate = conv_rate / 2

        eff = effective_spend(spend, saturation)
        clicks = round((eff / cpc) * jitter(noise))
        conversions = round(clicks * conv_rate * jitter(noise))
        cpa = round(spend / conversions, 2) if conversions > 0 else None

        results[channel] = {
            "spend": spend,
            "clicks": clicks,
            "conversions": conversions,
            "cpa": cpa,
        }
    return results
