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
    if (!file) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      toast.error('Failed to read image file');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) {
      toast.error('Please select an image first');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to upload images');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);
      const uploadResponse = await axios.post('/api/upload/profile-image', formData, {
        headers: {
          Authorization: token,
        },
      });

      if (!uploadResponse.data || !uploadResponse.data.imageUrl) {
        throw new Error('Invalid response from server');
      }

      const imageUrl = uploadResponse.data.imageUrl;


      if (updateEndpoint && userId) {
        const endpoint = updateEndpoint === '/api/account' 
          ? '/api/account' 
          : `${updateEndpoint}/${userId}`;
        
        try {
          await axios.put(
            endpoint,
            { profilepic: imageUrl },
            {
              headers: { Authorization: token },
            }
          );
        } catch (updateError) {
          console.error('Profile update error:', updateError);
          toast.error(updateError.response?.data?.error || 'Image uploaded but failed to update profile');
        }
      }

      toast.success('Profile picture updated successfully!');
      
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onImageUploaded) {
        await onImageUploaded(imageUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload image';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploading(false);
  };

  const displayImage = preview || currentImage;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center shadow-lg">
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
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg z-10"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 items-center w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          id="profile-image-input"
          disabled={uploading}
        />
        
        {!preview ? (
          <label htmlFor="profile-image-input" className="w-full cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full pointer-events-none"
              disabled={uploading}
            >
              <Camera className="w-4 h-4 mr-2" />
              {currentImage ? 'Change Photo' : 'Upload Photo'}
            </Button>
          </label>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleUpload}
              size="sm"
              disabled={uploading}
              className="bg-green-600 hover:bg-green-700 flex-1 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Save Photo
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

