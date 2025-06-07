# Image Best Practices for Next.js

## 📁 File Structure

```
frontend/
├── public/
│   └── images/           # Static images served at /images/*
│       └── qr-payment.jpg
├── components/
│   └── QRPaymentCode.tsx # Reusable QR code component
└── app/
    └── page.tsx          # Main app using the component
```

## 🎯 Next.js Image Optimization

### ✅ DO - Use Next.js Image Component
```tsx
import Image from "next/image"

<Image
  src="/images/qr-payment.jpg"
  alt="Descriptive alt text"
  width={192}
  height={192}
  priority={true}           // For above-the-fold images
  placeholder="blur"        // Smooth loading experience
  blurDataURL="..."        // Base64 blur placeholder
/>
```

### ❌ DON'T - Use Regular img Tag
```tsx
// Avoid this - no optimization
<img src="/images/qr-payment.jpg" alt="QR Code" />
```

## 🚀 Performance Features Used

### 1. **Automatic Optimization**
- WebP/AVIF format conversion
- Responsive image sizing
- Lazy loading by default

### 2. **Priority Loading**
- `priority={true}` for critical images (QR codes)
- Prevents layout shift

### 3. **Blur Placeholder**
- Smooth loading experience
- Base64 encoded micro-image

### 4. **Error Handling**
- Graceful fallback for missing images
- User-friendly error states

## 📦 Component Architecture

### QRPaymentCode Component
```tsx
interface QRPaymentCodeProps {
  amount: string
  destination: string
  network?: string
  className?: string
}
```

**Features:**
- Reusable across the app
- Props-driven configuration
- Built-in error handling
- TypeScript typed
- Responsive design

## 🎨 Styling Best Practices

### Container Sizing
```tsx
// Fixed container with relative positioning
<div className="w-48 h-48 relative">
  <Image style={{ width: '192px', height: '192px' }} />
</div>
```

### Object Fit
```tsx
className="object-contain"  // Maintains aspect ratio
className="object-cover"    // Fills container, may crop
```

## 🔧 Implementation Tips

1. **Always specify width/height** for layout stability
2. **Use descriptive alt text** for accessibility
3. **Organize images in `/public/images/`** folder
4. **Create reusable components** for common image patterns
5. **Handle error states** gracefully
6. **Use priority loading** for above-the-fold images

## 📱 Mobile Considerations

The QR code component is designed to be:
- **Touch-friendly** (48x48 minimum touch target)
- **Readable** on all screen sizes
- **Accessible** with proper alt text
- **Fast loading** with blur placeholder 