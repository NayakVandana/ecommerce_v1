<?php

namespace App\Enums;

enum PaymentType: string
{
    case CASH = 'CASH';
    case ONLINE = 'ONLINE';
    case OTHER = 'OTHER';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function default(): self
    {
        return self::CASH;
    }

    public function label(): string
    {
        return match($this) {
            self::CASH => 'Cash',
            self::ONLINE => 'Online',
            self::OTHER => 'Other',
        };
    }

    public static function fromValue(string $value): ?self
    {
        return self::tryFrom($value);
    }
}

