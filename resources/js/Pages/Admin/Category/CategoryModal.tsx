import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCategoryStore } from './useCategoryStore';
import toast from '../../../utils/toast';

export default function CategoryModal({
    isOpen,
    onClose,
    editingCategory,
    onSuccess,
    categories = []
}: any) {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        is_featured: false,
        parent_id: '',
        icon: '',
        sort_order: 0,
    });
    const [errors, setErrors] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    
    // Get parent categories (categories without parent_id)
    // Exclude the category being edited and prevent circular references
    const getAvailableParents = () => {
        if (!editingCategory) {
            // For new categories, all categories without parent_id are available
            return categories.filter((cat: any) => !cat.parent_id);
        }
        
        // For editing, exclude:
        // 1. The category being edited
        // 2. Categories that have this category as a parent (to prevent circular references)
        const excludeIds = [editingCategory.id];
        const getDescendantIds = (parentId: number): number[] => {
            const children = categories.filter((cat: any) => cat.parent_id === parentId);
            const ids = children.map((c: any) => c.id);
            children.forEach((child: any) => {
                ids.push(...getDescendantIds(child.id));
            });
            return ids;
        };
        excludeIds.push(...getDescendantIds(editingCategory.id));
        
        return categories.filter((cat: any) => 
            !cat.parent_id && 
            !excludeIds.includes(cat.id)
        );
    };
    
    const parentCategories = getAvailableParents();

    useEffect(() => {
        if (editingCategory) {
            setFormData({
                name: editingCategory.name || '',
                slug: editingCategory.slug || '',
                description: editingCategory.description || '',
                is_featured: editingCategory.is_featured || false,
                parent_id: editingCategory.parent_id || '',
                icon: editingCategory.icon || '',
                sort_order: editingCategory.sort_order || 0,
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                description: '',
                is_featured: false,
                parent_id: '',
                icon: '',
                sort_order: 0,
            });
        }
        setErrors({});
    }, [editingCategory, isOpen]);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Auto-generate slug from name
        if (name === 'name' && !editingCategory) {
            setFormData(prev => ({
                ...prev,
                slug: generateSlug(value)
            }));
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            let response;
            if (editingCategory) {
                response = await useCategoryStore.update({
                    id: editingCategory.id,
                    ...formData
                });
            } else {
                response = await useCategoryStore.store(formData);
            }

            if (response.data?.status) {
                onClose();
                setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    is_featured: false,
                    parent_id: '',
                    icon: '',
                    sort_order: 0,
                });
                setErrors({});
                onSuccess();
                toast({ message: editingCategory ? 'Category updated successfully' : 'Category created successfully', type: 'success' });
            } else {
                if (response.data?.errors) {
                    setErrors(response.data.errors);
                } else if (response.data?.message) {
                    setErrors({ general: response.data.message });
                }
            }
        } catch (error: any) {
            console.error('Error saving category:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                setErrors({ general: error.response.data.message });
            } else {
                setErrors({ general: 'An error occurred while saving the category' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            {errors.general && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-600">{errors.general}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            errors.name ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter category name"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* Slug */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Slug <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            errors.slug ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="category-slug"
                                    />
                                    {errors.slug && (
                                        <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        URL-friendly version of the name (auto-generated from name)
                                    </p>
                                </div>

                                {/* Parent Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Parent Category <span className="text-gray-500">(Optional)</span>
                                    </label>
                                    <select
                                        name="parent_id"
                                        value={formData.parent_id}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            errors.parent_id ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">None (Main Category)</option>
                                        {parentCategories
                                            .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
                                            .map((category: any) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.parent_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.parent_id}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Select a parent category to create a subcategory. Leave empty for main category.
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            errors.description ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter category description (optional)"
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                    )}
                                </div>

                                {/* Icon and Sort Order Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Icon */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Icon (Class Name)
                                        </label>
                                        <input
                                            type="text"
                                            name="icon"
                                            value={formData.icon}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                errors.icon ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="e.g., fa-shirt, fa-shoe"
                                        />
                                        {errors.icon && (
                                            <p className="mt-1 text-sm text-red-600">{errors.icon}</p>
                                        )}
                                    </div>

                                    {/* Sort Order */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sort Order
                                        </label>
                                        <input
                                            type="number"
                                            name="sort_order"
                                            value={formData.sort_order}
                                            onChange={handleInputChange}
                                            min="0"
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                errors.sort_order ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="0"
                                        />
                                        {errors.sort_order && (
                                            <p className="mt-1 text-sm text-red-600">{errors.sort_order}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Is Featured */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_featured"
                                        id="is_featured"
                                        checked={formData.is_featured}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                                        Featured Category
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

