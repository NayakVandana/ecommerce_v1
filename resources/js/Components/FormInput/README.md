# FormInput Components

A collection of reusable form input components for consistent form design across the application.

## Components

- **FormInput** - Text, email, password, and other input types
- **FormTextarea** - Multi-line text input
- **FormCheckbox** - Checkbox input with label
- **FormSelect** - Dropdown select input

## Usage

### Import Components

```tsx
import FormInput from '../Components/FormInput/FormInput';
import FormTextarea from '../Components/FormInput/FormTextarea';
import FormCheckbox from '../Components/FormInput/FormCheckbox';
import FormSelect from '../Components/FormInput/FormSelect';
```

### Basic FormInput Example

```tsx
<FormInput
    label="Email Address"
    id="email"
    name="email"
    type="email"
    value={data.email}
    onChange={(e) => setData('email', e.target.value)}
    placeholder="Enter your email"
    required
    error={errors.email}
    helperText="We'll never share your email"
/>
```

### FormTextarea Example

```tsx
<FormTextarea
    label="Message"
    id="message"
    name="message"
    rows={5}
    value={data.message}
    onChange={(e) => setData('message', e.target.value)}
    required
    error={errors.message}
    helperText="Enter your message here"
/>
```

### FormCheckbox Example

```tsx
<FormCheckbox
    id="remember"
    name="remember"
    checked={data.remember}
    onChange={(e) => setData('remember', e.target.checked)}
    label="Remember me"
    error={errors.remember}
/>
```

### FormSelect Example

```tsx
<FormSelect
    label="Country"
    id="country"
    name="country"
    value={data.country}
    onChange={(e) => setData('country', e.target.value)}
    required
    error={errors.country}
    options={[
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
    ]}
/>
```

## Props

### Common Props (All Components)

- `label?: string` - Label text for the input
- `error?: string` - Error message to display
- `helperText?: string` - Helper text shown below input (when no error)
- `labelClassName?: string` - Additional CSS classes for label
- `containerClassName?: string` - Additional CSS classes for container
- `required?: boolean` - Shows red asterisk (*) when true
- All standard HTML input/textarea/select attributes are supported

## Features

- ✅ Consistent styling across all form inputs
- ✅ Built-in error handling and display
- ✅ Helper text support
- ✅ Required field indicator (red asterisk)
- ✅ Fully typed with TypeScript
- ✅ Accessible (proper labels and IDs)
- ✅ Responsive design

