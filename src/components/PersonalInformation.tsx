import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Heart, Phone, Car, Home, Info, Camera, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface PersonalInfo {
  name: string;
  surname: string;
  blood_type: string;
  medical_aid_name: string;
  medical_aid_number: string;
  spouse_name: string;
  spouse_contact: string;
  friend_name: string;
  friend_surname: string;
  friend_contact: string;
  gender: string;
  age: string;
  vehicle_brand: string;
  vehicle_color: string;
  vehicle_registration: string;
  home_address: string;
  photo_url: string;
}

export const PersonalInformation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [info, setInfo] = useState<PersonalInfo>({
    name: '',
    surname: '',
    blood_type: '',
    medical_aid_name: '',
    medical_aid_number: '',
    spouse_name: '',
    spouse_contact: '',
    friend_name: '',
    friend_surname: '',
    friend_contact: '',
    gender: '',
    age: '',
    vehicle_brand: '',
    vehicle_color: '',
    vehicle_registration: '',
    home_address: '',
    photo_url: '',
  });

  useEffect(() => {
    if (user) {
      fetchPersonalInfo();
    }
  }, [user]);

  const fetchPersonalInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setInfo({
          name: data.name || '',
          surname: data.surname || '',
          blood_type: data.blood_type || '',
          medical_aid_name: data.medical_aid_name || '',
          medical_aid_number: data.medical_aid_number || '',
          spouse_name: data.spouse_name || '',
          spouse_contact: data.spouse_contact || '',
          friend_name: data.friend_name || '',
          friend_surname: data.friend_surname || '',
          friend_contact: data.friend_contact || '',
          gender: data.gender || '',
          age: data.age?.toString() || '',
          vehicle_brand: data.vehicle_brand || '',
          vehicle_color: data.vehicle_color || '',
          vehicle_registration: data.vehicle_registration || '',
          home_address: data.home_address || '',
          photo_url: data.photo_url || '',
        });
      }
    } catch (error) {
      console.error('Error fetching personal info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Delete old photo if exists
      if (info.photo_url) {
        const oldPath = info.photo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-photos')
            .remove([`${user!.id}/${oldPath}`]);
        }
      }

      // Upload new photo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      setInfo({ ...info, photo_url: publicUrl });

      toast({
        title: "Photo Uploaded",
        description: "Don't forget to save your information",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('personal_info')
        .upsert({
          user_id: user!.id,
          name: info.name,
          surname: info.surname,
          blood_type: info.blood_type,
          medical_aid_name: info.medical_aid_name,
          medical_aid_number: info.medical_aid_number,
          spouse_name: info.spouse_name,
          spouse_contact: info.spouse_contact,
          friend_name: info.friend_name,
          friend_surname: info.friend_surname,
          friend_contact: info.friend_contact,
          gender: info.gender,
          age: info.age ? parseInt(info.age) : null,
          vehicle_brand: info.vehicle_brand,
          vehicle_color: info.vehicle_color,
          vehicle_registration: info.vehicle_registration,
          home_address: info.home_address,
          photo_url: info.photo_url,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Saved Successfully",
        description: "Your personal information has been updated",
      });
    } catch (error) {
      console.error('Error saving personal info:', error);
      toast({
        title: "Error",
        description: "Failed to save personal information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Personal Information</h3>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This information will help emergency responders assist you in case of an emergency
        </AlertDescription>
      </Alert>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 space-y-6">
          {/* Profile Photo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-base">Profile Photo</h4>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={info.photo_url} alt="Profile photo" />
                <AvatarFallback className="text-2xl">
                  {info.name?.[0]?.toUpperCase() || info.surname?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col items-center gap-2">
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    {uploading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Photo
                      </>
                    )}
                  </div>
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Max 5MB • JPG, PNG, WEBP
                </p>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-base">Personal Details</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={info.name}
                  onChange={(e) => setInfo({ ...info, name: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  value={info.surname}
                  onChange={(e) => setInfo({ ...info, surname: e.target.value })}
                  placeholder="Enter your surname"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={info.gender} onValueChange={(value) => setInfo({ ...info, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={info.age}
                  onChange={(e) => setInfo({ ...info, age: e.target.value })}
                  placeholder="Enter your age"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-base">Medical Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blood_type">Blood Type</Label>
                <Input
                  id="blood_type"
                  value={info.blood_type}
                  onChange={(e) => setInfo({ ...info, blood_type: e.target.value })}
                  placeholder="e.g., A+, O-, B+"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical_aid_name">Medical Aid Name</Label>
                <Input
                  id="medical_aid_name"
                  value={info.medical_aid_name}
                  onChange={(e) => setInfo({ ...info, medical_aid_name: e.target.value })}
                  placeholder="Enter medical aid provider"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="medical_aid_number">Medical Aid Number</Label>
                <Input
                  id="medical_aid_number"
                  value={info.medical_aid_number}
                  onChange={(e) => setInfo({ ...info, medical_aid_number: e.target.value })}
                  placeholder="Enter medical aid number"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-base">Emergency Contacts</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spouse_name">Spouse Name</Label>
                <Input
                  id="spouse_name"
                  value={info.spouse_name}
                  onChange={(e) => setInfo({ ...info, spouse_name: e.target.value })}
                  placeholder="Enter spouse name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spouse_contact">Spouse Contact Number</Label>
                <Input
                  id="spouse_contact"
                  value={info.spouse_contact}
                  onChange={(e) => setInfo({ ...info, spouse_contact: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="friend_name">Friend Name</Label>
                <Input
                  id="friend_name"
                  value={info.friend_name}
                  onChange={(e) => setInfo({ ...info, friend_name: e.target.value })}
                  placeholder="Enter friend name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="friend_surname">Friend Surname</Label>
                <Input
                  id="friend_surname"
                  value={info.friend_surname}
                  onChange={(e) => setInfo({ ...info, friend_surname: e.target.value })}
                  placeholder="Enter friend surname"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="friend_contact">Friend Contact Number</Label>
                <Input
                  id="friend_contact"
                  value={info.friend_contact}
                  onChange={(e) => setInfo({ ...info, friend_contact: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-base">Vehicle Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                <Input
                  id="vehicle_brand"
                  value={info.vehicle_brand}
                  onChange={(e) => setInfo({ ...info, vehicle_brand: e.target.value })}
                  placeholder="e.g., Toyota, BMW"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_color">Vehicle Color</Label>
                <Input
                  id="vehicle_color"
                  value={info.vehicle_color}
                  onChange={(e) => setInfo({ ...info, vehicle_color: e.target.value })}
                  placeholder="e.g., White, Black"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vehicle_registration">Vehicle Registration Number</Label>
                <Input
                  id="vehicle_registration"
                  value={info.vehicle_registration}
                  onChange={(e) => setInfo({ ...info, vehicle_registration: e.target.value })}
                  placeholder="Enter registration number"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-base">Address</h4>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="home_address">Home Address</Label>
              <Input
                id="home_address"
                value={info.home_address}
                onChange={(e) => setInfo({ ...info, home_address: e.target.value })}
                placeholder="Enter your home address"
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Information
              </>
            )}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
};