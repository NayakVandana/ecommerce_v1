export default function FormHelperText({ error, helperText }: any) {
    if (error) {
        return <p className="mt-1 text-sm text-red-600">{error}</p>;
    }
    if (helperText) {
        return <p className="mt-1 text-sm text-gray-500">{helperText}</p>;
    }
    return null;
}

