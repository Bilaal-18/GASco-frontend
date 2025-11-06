import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/config/config';

export default function ProfileImageUpload({ 
  currentImage, 
  onImageUploaded, 
  userId,
  updateEndpoint 
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files[0]) {
      toast.error('Please select an image first');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', fileInputRef.current.files[0]);

      // Upload image to Cloudinary
      const uploadResponse = await axios.post('/api/upload/profile-image', formData, {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = uploadResponse.data.imageUrl;

      // Update user profile with image URL
      if (updateEndpoint) {
        const endpoint = updateEndpoint === '/api/account' 
          ? '/api/account' 
          : `${updateEndpoint}/${userId}`;
        
        await axios.put(
          endpoint,
          { profilepic: imageUrl },
          {
            headers: { Authorization: token },
          }
        );
      }

      toast.success('Profile picture updated successfully!');
      
      if (onImageUploaded) {
        onImageUploaded(imageUrl);
      }

      // Clear preview and file input
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = preview || currentImage;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        {preview && (
          <button
            onClick={handleCancel}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="profile-image-input"
        />
        <label htmlFor="profile-image-input">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={uploading}
          >
            <Camera className="w-4 h-4 mr-2" />
            {currentImage ? 'Change Photo' : 'Upload Photo'}
          </Button>
        </label>

        {preview && (
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              size="sm"
              disabled={uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Save Photo'
              )}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

