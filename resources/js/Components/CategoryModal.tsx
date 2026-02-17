import { useEffect, useState } from 'react';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import CategoryIcon from './CategoryIcon';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentCategory: any;
    allCategories: any[];
}

interface GroupedCategory {
    parent: any;
    children: any[];
}

export default function CategoryModal({
    isOpen,
    onClose,
    parentCategory,
    allCategories,
}: CategoryModalProps) {
    const [groupedCategories, setGroupedCategories] = useState<GroupedCategory[]>([]);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        if (isOpen && parentCategory && allCategories.length > 0) {
            document.body.style.overflow = 'hidden';
            
            // Get organized category structure with full hierarchy
            const organized = organizeCategories(allCategories, parentCategory.id);
            setGroupedCategories(organized);
            
            // Count total categories recursively
            const total = organized.reduce((sum, group) => {
                return sum + countAllCategories(group.children);
            }, 0);
            setTotalCount(total);
            
            console.log(`[CategoryModal] Showing ${organized.length} parent groups with ${total} total subcategories (all visible)`);
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, parentCategory, allCategories]);

    if (!isOpen || !parentCategory) return null;

    // Count all categories recursively
    const countAllCategories = (categories: any[]): number => {
        let count = categories.length;
        for (const cat of categories) {
            if (cat.children && cat.children.length > 0) {
                count += countAllCategories(cat.children);
            }
        }
        return count;
    };

    // Organize categories maintaining full hierarchy
    const organizeCategories = (categories: any[], targetParentId: number): GroupedCategory[] => {
        let groups: GroupedCategory[] = [];
        
        // Check if categories are hierarchical
        if (categories.length > 0 && categories[0]?.children !== undefined) {
            const findParent = (cats: any[]): any => {
                for (const cat of cats) {
                    if (cat.id === targetParentId) {
                        return cat;
                    }
                    if (cat.children && cat.children.length > 0) {
                        const found = findParent(cat.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            
            const parent = findParent(categories);
            if (parent && parent.children && parent.children.length > 0) {
                // Keep full hierarchy intact
                groups = parent.children.map((child: any) => ({
                    parent: child,
                    children: child.children || []
                }));
            }
        } else {
            // Build hierarchy from flat structure
            const directChildren = categories.filter(cat => cat.parent_id === targetParentId);
            groups = directChildren.map(child => {
                const childCategories = buildHierarchy(categories, child.id);
                return {
                    parent: child,
                    children: childCategories
                };
            });
        }
        
        return groups;
    };

    // Build hierarchy from flat structure
    const buildHierarchy = (categories: any[], parentId: number): any[] => {
        const children = categories.filter(cat => cat.parent_id === parentId);
        return children.map(child => ({
            ...child,
            children: buildHierarchy(categories, child.id)
        }));
    };

    const hasChildren = (category: any): boolean => {
        return category.children && Array.isArray(category.children) && category.children.length > 0;
    };

    const handleCategoryClick = (category: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (category.slug) {
            router.visit(`/categories/${category.slug}`);
            onClose();
        }
    };

    // Render a category and ALL its children recursively (always expanded)
    const renderNestedCategory = (category: any, level: number = 0) => {
        const hasSub = hasChildren(category);

        return (
            <div key={category.id} className={`${level > 0 ? 'ml-4' : ''} mb-1`}>
                <button
                    onClick={(e) => handleCategoryClick(category, e)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all group flex items-center justify-between ${
                        hasSub 
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-l-4 border-orange-400' 
                            : 'hover:bg-indigo-50 border-l-2 border-transparent hover:border-indigo-300'
                    }`}
                >
                    <div className="flex items-center gap-2 flex-1">
                        <span className={`text-sm flex-1 ${
                            hasSub 
                                ? 'text-orange-700 font-bold' 
                                : 'text-gray-700 group-hover:text-indigo-700 font-medium'
                        }`}>
                            {category.name}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {category.products_count !== undefined && category.products_count > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                hasSub 
                                    ? 'bg-orange-200 text-orange-800 font-semibold' 
                                    : 'bg-gray-200 text-gray-600 group-hover:bg-indigo-200 group-hover:text-indigo-700'
                            }`}>
                                {category.products_count}
                            </span>
                        )}
                        {hasSub && (
                            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">
                                {category.children.length}
                            </span>
                        )}
                        <ChevronRightIcon className={`h-4 w-4 transition-opacity ${
                            hasSub 
                                ? 'text-orange-500 opacity-100' 
                                : 'text-gray-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100'
                        }`} />
                    </div>
                </button>

                {/* Always show nested children if they exist - NO COLLAPSE */}
                {hasSub && (
                    <div className="ml-3 mt-1 pl-3 border-l-2 border-orange-200 space-y-1">
                        {category.children.map((child: any) => renderNestedCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex min-h-full items-start justify-center pt-4 sm:pt-10">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal Content */}
                <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full mx-4 max-w-[95vw] max-h-[85vh] flex flex-col">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center shadow-lg">
                                    <CategoryIcon 
                                        icon={parentCategory.icon} 
                                        className="h-6 w-6 text-indigo-600"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-white" id="modal-title">
                                        {parentCategory.name}
                                    </h2>
                                    {totalCount > 0 && (
                                        <p className="text-indigo-100 text-sm">
                                            {totalCount} {totalCount === 1 ? 'subcategory' : 'subcategories'} (all visible)
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Categories Content */}
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                        {groupedCategories.length > 0 ? (
                            <div className="p-6">
                                {/* Info Bar */}
                                <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-700 mb-2">Category Guide:</p>
                                            <div className="flex flex-wrap gap-4 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-orange-400"></div>
                                                    <span className="text-gray-600"><span className="font-semibold text-orange-600">Orange</span> = Has subcategories</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-white border border-gray-300"></div>
                                                    <span className="text-gray-600"><span className="font-semibold">White</span> = End category</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ChevronRightIcon className="h-4 w-4 text-indigo-500" />
                                                    <span className="text-gray-600">Click any to view products</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleCategoryClick(parentCategory, e as any)}
                                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                                        >
                                            View All Products
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Category Groups Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {groupedCategories.map((group) => (
                                        <div key={group.parent.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all">
                                            {/* Parent Category Header */}
                                            <button
                                                onClick={(e) => handleCategoryClick(group.parent, e)}
                                                className="w-full group p-5 bg-gradient-to-br from-pink-50 to-purple-50 border-b-2 border-pink-300"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                        <CategoryIcon 
                                                            icon={group.parent.icon} 
                                                            className="h-6 w-6 text-white"
                                                        />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <h3 className="text-base font-bold text-pink-600 group-hover:text-pink-700 transition-colors">
                                                            {group.parent.name}
                                                        </h3>
                                                        {group.parent.products_count !== undefined && group.parent.products_count > 0 && (
                                                            <p className="text-xs text-pink-500 font-semibold mt-0.5">
                                                                {group.parent.products_count} {group.parent.products_count === 1 ? 'item' : 'items'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ChevronRightIcon className="h-5 w-5 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </button>

                                            {/* Child Categories List - ALL EXPANDED BY DEFAULT */}
                                            <div className="p-4 max-h-96 overflow-y-auto">
                                                {group.children.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {group.children.map((child) => renderNestedCategory(child, 0))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 italic text-center py-3">
                                                        No subcategories
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-16 px-6">
                                <div className="text-center max-w-md">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <CategoryIcon icon={null} className="h-10 w-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subcategories</h3>
                                    <p className="text-gray-500 mb-6">
                                        This category doesn't have any subcategories yet.
                                    </p>
                                    <button
                                        onClick={(e) => handleCategoryClick(parentCategory, e as any)}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium"
                                    >
                                        View All Products
                                        <ChevronRightIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-white border-t border-gray-200 px-6 py-3.5 flex justify-between items-center">
                        <p className="text-xs text-gray-500 hidden sm:block">
                            <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
                            All categories are visible • Click any to browse products
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="ml-auto px-5 py-2 border-2 border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
