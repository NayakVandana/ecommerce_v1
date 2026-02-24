import { useEffect, useState } from 'react';
import { useCategoryStore } from './useCategoryStore';
import AdminLayout from '../Layout';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import CategoryModal from './CategoryModal';
import toast from '../../../utils/toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

export default function CategoryIndex() {
    const [categories, setCategories] = useState<any[]>([]);
    const [categoriesFlat, setCategoriesFlat] = useState<any[]>([]); // Store flat list for operations
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');

    useEffect(() => {
        loadCategories();
    }, []);

    // Helper function to get full category path
    const getCategoryPath = (category: any, allCategories: any[]): string => {
        const path: string[] = [category.name];
        let currentCategory = category;
        
        while (currentCategory.parent_id) {
            const parent = allCategories.find((c: any) => c.id === currentCategory.parent_id);
            if (parent) {
                path.unshift(parent.name);
                currentCategory = parent;
            } else {
                break;
            }
        }
        
        return path.join(' > ');
    };

    // Helper function to get category level
    const getCategoryLevel = (category: any, allCategories: any[]): string => {
        if (!category.parent_id) return 'Main Category';
        
        let level = 1;
        let currentCategory = category;
        
        while (currentCategory.parent_id) {
            const parent = allCategories.find((c: any) => c.id === currentCategory.parent_id);
            if (parent) {
                level++;
                currentCategory = parent;
            } else {
                break;
            }
        }
        
        if (level === 1) return 'Subcategory';
        if (level === 2) return 'Child Category';
        return `Level ${level}`;
    };

    // Helper function to build hierarchical list for display
    const buildHierarchicalList = (allCategories: any[]): any[] => {
        const mainCategories = allCategories.filter((cat: any) => !cat.parent_id);
        const hierarchicalList: any[] = [];
        
        const addCategoryAndChildren = (category: any, level: number = 0) => {
            // Add the category itself
            hierarchicalList.push({ ...category, displayLevel: level });
            
            // Find and add all direct children
            const children = allCategories
                .filter((cat: any) => cat.parent_id === category.id)
                .sort((a: any, b: any) => {
                    // Sort by sort_order first, then by name
                    if (a.sort_order !== b.sort_order) {
                        return (a.sort_order || 0) - (b.sort_order || 0);
                    }
                    return (a.name || '').localeCompare(b.name || '');
                });
            
            // Recursively add children
            children.forEach((child: any) => {
                addCategoryAndChildren(child, level + 1);
            });
        };
        
        // Start with main categories, sorted by sort_order then name
        mainCategories
            .sort((a: any, b: any) => {
                if (a.sort_order !== b.sort_order) {
                    return (a.sort_order || 0) - (b.sort_order || 0);
                }
                return (a.name || '').localeCompare(b.name || '');
            })
            .forEach((mainCat: any) => {
                addCategoryAndChildren(mainCat, 0);
            });
        
        return hierarchicalList;
    };

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await useCategoryStore.list();
            if (response.data?.status) {
                // Use flat list for modal and operations
                const flatCategories = response.data.data?.flat || response.data.data || [];
                
                // Store flat list for operations (modal, path calculations, etc.)
                setCategoriesFlat(flatCategories);
                
                // Build hierarchical list for display
                const hierarchicalList = buildHierarchicalList(flatCategories);
                
                setCategories(hierarchicalList);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleDeleteClick = (categoryId: number) => {
        setDeleteCategoryId(categoryId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteCategoryId) return;
        
        try {
            const response = await useCategoryStore.delete({ id: deleteCategoryId });
            if (response.data?.status) {
                loadCategories();
                setShowDeleteModal(false);
                setDeleteCategoryId(null);
                toast({ message: 'Category deleted successfully', type: 'success' });
            } else {
                setShowDeleteModal(false);
                const errorMsg = response.data?.message || 'Failed to delete category';
                setAlertMessage(errorMsg);
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting category:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete category';
            setShowDeleteModal(false);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingCategory(null);
    };

    const handleModalSuccess = () => {
        loadCategories();
    };

    return (
        <AdminLayout currentPath="/admin/categories">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage product categories and their hierarchy</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setShowModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add New Category
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Full Path
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Products
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.length > 0 ? (
                                    categories.map((category: any) => {
                                        // Use flat list for path and level calculations
                                        const categoryPath = getCategoryPath(category, categoriesFlat);
                                        const categoryLevel = getCategoryLevel(category, categoriesFlat);
                                        const parentCategory = category.parent_id 
                                            ? categoriesFlat.find((c: any) => c.id === category.parent_id)
                                            : null;
                                        
                                        const displayLevel = category.displayLevel || 0;
                                        const indentPx = displayLevel * 32;
                                        
                                        return (
                                        <tr 
                                            key={category.id} 
                                            className={`hover:bg-blue-50 ${
                                                displayLevel === 0 ? 'bg-gray-50 font-semibold' : 
                                                displayLevel === 1 ? 'bg-white' : 
                                                'bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div 
                                                    className="text-sm font-medium text-gray-900 flex items-center"
                                                    style={{ paddingLeft: `${indentPx}px` }}
                                                >
                                                    {displayLevel > 0 && (
                                                        <span className="mr-2 text-gray-400 flex-shrink-0 font-mono">
                                                            {displayLevel === 1 ? '├─' : displayLevel === 2 ? '└─' : '└─'}
                                                        </span>
                                                    )}
                                                    {displayLevel === 0 && (
                                                        <span className="mr-2 text-blue-500 flex-shrink-0">●</span>
                                                    )}
                                                    <span className={displayLevel === 0 ? 'text-gray-900 font-bold text-base' : displayLevel === 1 ? 'text-gray-800' : 'text-gray-700'}>
                                                        {category.name}
                                                    </span>
                                                </div>
                                                {category.description && (
                                                    <div 
                                                        className="text-xs text-gray-500 mt-1 max-w-xs truncate"
                                                        style={{ paddingLeft: `${indentPx + (displayLevel > 0 ? 32 : 20)}px` }}
                                                    >
                                                        {category.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    !category.parent_id 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : categoryLevel === 'Subcategory'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-pink-100 text-pink-800'
                                                }`}>
                                                    {categoryLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">
                                                    {categoryPath}
                                                </div>
                                                {parentCategory && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Parent: {parentCategory.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {category.products_count || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                    <span className="text-sm text-green-600 font-medium">Active</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {category.created_at 
                                                        ? new Date(category.created_at).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })
                                                        : 'N/A'
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCategory(category);
                                                            setShowModal(true);
                                                        }}
                                                        className="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                                        title="Edit Category"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(category.id)}
                                                        className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                        title="Delete Category"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No categories found. Click "Add New Category" to create one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create/Edit Category Modal */}
                <CategoryModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    editingCategory={editingCategory}
                    onSuccess={handleModalSuccess}
                    categories={categoriesFlat}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeleteCategoryId(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Category"
                    message="Are you sure you want to delete this category? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    confirmButtonColor="red"
                />

                {/* Alert Modal */}
                <AlertModal
                    isOpen={showAlert}
                    onClose={() => setShowAlert(false)}
                    message={alertMessage}
                    type={alertType}
                />
            </div>
        </AdminLayout>
    );
}

