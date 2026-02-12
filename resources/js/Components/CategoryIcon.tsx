import { 
    TagIcon,
    UserIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    HandRaisedIcon,
    ClockIcon,
    EyeIcon,
    BriefcaseIcon,
    SparklesIcon,
    HomeIcon,
    ShoppingBagIcon,
} from '@heroicons/react/24/outline';

interface CategoryIconProps {
    icon?: string | null;
    className?: string;
}

// Map FontAwesome icon class names to Heroicons
const iconMap: { [key: string]: any } = {
    'fa-user': UserIcon,
    'fa-child': UserIcon,
    'fa-baby': UserIcon,
    'fa-laptop': ComputerDesktopIcon,
    'fa-hands': HandRaisedIcon,
    'fa-tshirt': TagIcon,
    'fa-shoe-prints': ShoppingBagIcon,
    'fa-clock': ClockIcon,
    'fa-glasses': EyeIcon,
    'fa-briefcase': BriefcaseIcon,
    'fa-gem': SparklesIcon,
    'fa-home': HomeIcon,
    'fa-bag-shopping': ShoppingBagIcon,
    'fa-vest': TagIcon,
    'fa-bed': HomeIcon,
    'fa-hat-cowboy': TagIcon,
    'fa-scarf': TagIcon,
    'fa-handbag': ShoppingBagIcon,
    'fa-ring': SparklesIcon,
    'fa-smartwatch': ClockIcon,
    'fa-shoe': ShoppingBagIcon,
    'fa-mobile-alt': DevicePhoneMobileIcon,
    'fa-tv': ComputerDesktopIcon,
    'fa-spa': SparklesIcon,
    'fa-dumbbell': HandRaisedIcon,
    'fa-book': TagIcon,
};

export default function CategoryIcon({ icon, className = "h-4 w-4" }: CategoryIconProps) {
    if (!icon) {
        return <TagIcon className={className} />;
    }

    // Extract icon class name (e.g., "fa-tshirt" from "fa fa-tshirt")
    const iconClass = icon.split(' ').find(cls => cls.startsWith('fa-')) || icon;
    const IconComponent = iconMap[iconClass] || TagIcon;

    return <IconComponent className={className} />;
}

