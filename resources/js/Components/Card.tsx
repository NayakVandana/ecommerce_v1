const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export default function Card({ children, className = '', hover = false, padding = 'md' }: any) {
    const hoverClass = hover ? 'hover:shadow-xl transition-all duration-300' : '';
    return (
        <div className={`bg-white rounded-xl shadow-lg ${paddingClasses[padding]} ${hoverClass} ${className}`}>
            {children}
        </div>
    );
}

