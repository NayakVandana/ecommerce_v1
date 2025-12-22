const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
};

export default function Container({ children, className = '', size = 'lg' }: any) {
    return (
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size as keyof typeof sizeClasses]} ${className}`}>
            {children}
        </div>
    );
}

