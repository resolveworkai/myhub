import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Camera,
  GripVertical,
  Plus,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BusinessImageUploadProps {
  logo?: string;
  coverImage?: string;
  galleryImages?: string[];
  onLogoChange: (url: string) => void;
  onCoverChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_GALLERY_IMAGES = 5;

// Compress image to reduce size
const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const validateFile = (file: File): string | null => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Please upload a JPG, PNG, or WebP image';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Image must be less than 5MB';
  }
  return null;
};

interface ImageUploadBoxProps {
  image?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  aspectRatio?: 'square' | 'landscape';
  label: string;
  hint?: string;
  className?: string;
}

function ImageUploadBox({ 
  image, 
  onUpload, 
  onRemove, 
  aspectRatio = 'square',
  label,
  hint,
  className
}: ImageUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setIsLoading(true);
    try {
      const compressed = await compressImage(file);
      onUpload(compressed);
    } catch (err) {
      toast.error('Failed to process image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {image ? (
        <div className={cn(
          'relative rounded-xl overflow-hidden border border-border group',
          aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'
        )}>
          <img 
            src={image} 
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-1" />
              Change
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className={cn(
            'w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground',
            aspectRatio === 'square' ? 'aspect-square' : 'aspect-video',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          ) : (
            <>
              <Upload className="h-8 w-8" />
              <span className="text-sm font-medium">{label}</span>
              {hint && <span className="text-xs">{hint}</span>}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function BusinessImageUpload({
  logo,
  coverImage,
  galleryImages = [],
  onLogoChange,
  onCoverChange,
  onGalleryChange,
  className
}: BusinessImageUploadProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_GALLERY_IMAGES - galleryImages.length;
    if (files.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'}`);
      return;
    }

    setIsGalleryLoading(true);
    try {
      const newImages: string[] = [];
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`);
          continue;
        }
        const compressed = await compressImage(file);
        newImages.push(compressed);
      }
      onGalleryChange([...galleryImages, ...newImages]);
    } catch (err) {
      toast.error('Failed to process images');
    } finally {
      setIsGalleryLoading(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  const removeGalleryImage = (index: number) => {
    onGalleryChange(galleryImages.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Logo and Cover */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Logo */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Business Logo
          </label>
          <ImageUploadBox
            image={logo}
            onUpload={onLogoChange}
            onRemove={() => onLogoChange('')}
            aspectRatio="square"
            label="Upload Logo"
            hint="1:1 ratio, max 5MB"
          />
        </div>

        {/* Cover Image */}
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Cover Image
          </label>
          <ImageUploadBox
            image={coverImage}
            onUpload={onCoverChange}
            onRemove={() => onCoverChange('')}
            aspectRatio="landscape"
            label="Upload Cover"
            hint="16:9 ratio recommended"
          />
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Gallery Images ({galleryImages.length}/{MAX_GALLERY_IMAGES})
          </label>
          {galleryImages.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Drag to reorder
            </span>
          )}
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          onChange={handleGalleryUpload}
          className="hidden"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {galleryImages.map((img, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-border group"
            >
              <img 
                src={img} 
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeGalleryImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
          
          {galleryImages.length < MAX_GALLERY_IMAGES && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isGalleryLoading}
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
            >
              {isGalleryLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              ) : (
                <>
                  <Plus className="h-6 w-6" />
                  <span className="text-xs">Add</span>
                </>
              )}
            </button>
          )}
        </div>

        {galleryImages.length === 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Add photos to help customers discover your business
          </p>
        )}
      </div>
    </div>
  );
}
