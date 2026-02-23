<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CASH_ON_DELIVERY = 'CASH_ON_DELIVERY';
    case ONLINE_PAYMENT = 'ONLINE_PAYMENT';
    case BANK_TRANSFER = 'BANK_TRANSFER';
    case UPI = 'UPI';
    case CREDIT_CARD = 'CREDIT_CARD';
    case DEBIT_CARD = 'DEBIT_CARD';
    case WALLET = 'WALLET';
    case OTHER = 'OTHER';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function default(): self
    {
        return self::CASH_ON_DELIVERY;
    }

    public function label(): string
    {
        return match($this) {
            self::CASH_ON_DELIVERY => 'Cash on Delivery',
            self::ONLINE_PAYMENT => 'Online Payment',
            self::BANK_TRANSFER => 'Bank Transfer',
            self::UPI => 'UPI',
            self::CREDIT_CARD => 'Credit Card',
            self::DEBIT_CARD => 'Debit Card',
            self::WALLET => 'Wallet',
            self::OTHER => 'Other',
        };
    }

    public static function fromValue(string $value): ?self
    {
        return self::tryFrom($value);
    }
}

