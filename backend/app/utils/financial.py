from typing import List, Dict, Tuple
from decimal import Decimal, ROUND_DOWN
from uuid import UUID


def calculate_proportional_splits(
    total_amount_minor: int,
    allocations: List[Tuple[UUID, Decimal]]  # [(user_id, allocation_pct), ...]
) -> Dict[UUID, int]:
    """
    Calculate proportional splits using Largest Remainder Method (Hare-Niemeyer)

    Args:
        total_amount_minor: Total amount in minor units (cents)
        allocations: List of (user_id, allocation_percentage) tuples

    Returns:
        Dict mapping user_id to their share in minor units
    """
    if not allocations:
        return {}

    # Calculate raw shares
    raw_shares = []
    for user_id, allocation_pct in allocations:
        raw_share = Decimal(total_amount_minor) * allocation_pct
        raw_shares.append((user_id, raw_share))

    # Floor each share and calculate remainders
    floored_shares = {}
    remainders = []
    total_floored = 0

    for user_id, raw_share in raw_shares:
        floored = int(raw_share.quantize(Decimal('1'), rounding=ROUND_DOWN))
        remainder = raw_share - floored

        floored_shares[user_id] = floored
        remainders.append((user_id, remainder))
        total_floored += floored

    # Distribute leftover cents by highest remainders
    leftover = total_amount_minor - total_floored
    remainders.sort(key=lambda x: x[1], reverse=True)

    result = floored_shares.copy()
    for i in range(leftover):
        if i < len(remainders):
            user_id = remainders[i][0]
            result[user_id] += 1

    return result


def validate_allocation_percentages(allocations: List[Decimal], tolerance: Decimal = Decimal('0.0001')) -> bool:
    """
    Validate that allocation percentages sum to 1.0 (within tolerance)

    Args:
        allocations: List of allocation percentages
        tolerance: Acceptable deviation from 1.0

    Returns:
        True if allocations are valid
    """
    total = sum(allocations)
    return abs(total - Decimal('1.0')) <= tolerance


def format_currency(amount_minor: int, currency: str = "USD") -> str:
    """
    Format minor units as currency string

    Args:
        amount_minor: Amount in minor units (cents)
        currency: Currency code

    Returns:
        Formatted currency string
    """
    major_units = amount_minor / 100

    # Simple formatting - in production you'd use proper locale formatting
    if currency == "USD":
        return f"${major_units:.2f}"
    elif currency == "SGD":
        return f"S${major_units:.2f}"
    elif currency == "EUR":
        return f"€{major_units:.2f}"
    else:
        return f"{major_units:.2f} {currency}"


def parse_currency_input(amount_str: str) -> int:
    """
    Parse currency input string to minor units

    Args:
        amount_str: Currency string like "$10.50" or "10.50"

    Returns:
        Amount in minor units
    """
    # Remove currency symbols and whitespace
    cleaned = amount_str.strip().replace('$', '').replace('€', '').replace('S$', '')

    try:
        amount = float(cleaned)
        return int(amount * 100)  # Convert to minor units
    except ValueError:
        raise ValueError(f"Invalid currency format: {amount_str}")


def calculate_balance_summary(ledger_entries: List[Dict]) -> Dict:
    """
    Calculate balance summary from ledger entries

    Args:
        ledger_entries: List of ledger entry dicts with type and amount_minor

    Returns:
        Dict with balance breakdown
    """
    pledged = 0
    debited = 0
    credited = 0
    adjusted = 0

    for entry in ledger_entries:
        amount = entry['amount_minor']
        entry_type = entry['type']

        if entry_type == 'PLEDGE':
            pledged += amount
        elif entry_type == 'DEBIT':
            debited += amount
        elif entry_type == 'CREDIT':
            credited += amount
        elif entry_type == 'ADJUST':
            adjusted += amount

    net_balance = pledged - debited + credited + adjusted

    return {
        'pledged': pledged,
        'debited': debited,
        'credited': credited,
        'adjusted': adjusted,
        'net_balance': net_balance,
        'status': 'surplus' if net_balance > 0 else 'settled' if net_balance == 0 else 'deficit'
    }