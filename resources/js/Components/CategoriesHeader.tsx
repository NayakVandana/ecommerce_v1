import { Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { useCategoryStore } from '@/Pages/Categories/useCategoryStore';
import CategoryIcon from './CategoryIcon';
import CategoryModal from './CategoryModal';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function CategoriesHeader() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<any>(null);
    const [allCategoriesForModal, setAllCategoriesForModal] = useState<any[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const [categoriesRes, allCategoriesRes] = await Promise.all([
                useCategoryStore.home(),
                useCategoryStore.list(),
            ]);

            if (categoriesRes.data?.status && categoriesRes.data?.data) {
                let categoriesArray = [];
                if (Array.isArray(categoriesRes.data.data)) {
                    categoriesArray = categoriesRes.data.data;
                }
                setCategories(categoriesArray);
            }

            if (allCategoriesRes.data?.status && allCategoriesRes.data?.data) {
                const categoriesData = allCategoriesRes.data.data;
                if (categoriesData.hierarchical && Array.isArray(categoriesData.hierarchical)) {
                    setAllCategoriesForModal(categoriesData.hierarchical);
                } else if (categoriesData.flat && Array.isArray(categoriesData.flat)) {
                    setAllCategoriesForModal(categoriesData.flat);
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (e: React.MouseEvent, category: any) => {
        e.preventDefault();
        setSelectedCategoryForModal(category);
        setShowCategoryModal(true);
    };

    const checkScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        checkScrollButtons();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollButtons);
            window.addEventListener('resize', checkScrollButtons);
        }
        return () => {
            if (container) {
                container.removeEventListener('scroll', checkScrollButtons);
            }
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [categories]);

    if (loading || categories.length === 0) {
        return null;
    }

    return (
        <>
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-20 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex items-center gap-2 py-3">
                        {canScrollLeft && (
                            <button
                                onClick={scrollLeft}
                                className="absolute left-0 z-10 bg-white hover:bg-gray-50 p-2 rounded-lg shadow-md border border-gray-200 transition-colors"
                                aria-label="Scroll left"
                            >
                                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                            </button>
                        )}
                        
                        <div
                            ref={scrollContainerRef}
                            className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 px-8"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={(e) => handleCategoryClick(e, category)}
                                    className="flex items-center gap-2 group px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors flex-shrink-0">
                                        <CategoryIcon 
                                            icon={category.icon} 
                                            className="h-5 w-5 text-indigo-600"
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap group-hover:text-indigo-600 transition-colors">
                                        {category.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {canScrollRight && (
                            <button
                                onClick={scrollRight}
                                className="absolute right-0 z-10 bg-white hover:bg-gray-50 p-2 rounded-lg shadow-md border border-gray-200 transition-colors"
                                aria-label="Scroll right"
                            >
                                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                            </button>
                        )}
                        
                        {/* <Link
                            href="/categories"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-indigo-600 flex-shrink-0 ml-2"
                        >
                            View All →
                        </Link> */}
                    </div>
                </div>
            </div>

            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                parentCategory={selectedCategoryForModal}
                allCategories={allCategoriesForModal}
            />
        </>
    );
}

