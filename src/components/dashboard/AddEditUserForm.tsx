import React, {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {User, Mail, Phone, GraduationCap, Star} from "lucide-react";
import {useToast} from "@/hooks/use-toast";

export interface UserFormValues {
    id?: number;
    profilePic?: string | null;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    expertise?: string;
    experience?: string;
    education?: string;
}

interface AddEditUserFormProps {
    initialValues?: Partial<UserFormValues>;
    mode?: "add" | "edit";
    onSubmit: (values: UserFormValues) => void;
    onCancel?: () => void;
}

const ROLE_OPTIONS = [
    {value: "admin", label: "Admin"},
    {value: "super-admin", label: "Super Admin"},
    {value: "wellness-coach", label: "Wellness Coach"},
    {value: "support-staff", label: "Support Staff"},
    {value: "counsellor", label: "Counsellor"},
];

export default function AddEditUserForm({
                                            initialValues = {},
                                            mode = "add",
                                            onSubmit,
                                            onCancel,
                                        }: AddEditUserFormProps) {
    const [profilePic, setProfilePic] = useState<string | null>(
        initialValues.profilePic || null
    );
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const [fullName, setFullName] = useState(initialValues.fullName || "");
    const [email, setEmail] = useState(initialValues.email || "");
    const [phone, setPhone] = useState(initialValues.phone || "");
    const [role, setRole] = useState(initialValues.role || "admin");
    const [expertise, setExpertise] = useState(initialValues.expertise || "");
    const [experience, setExperience] = useState(initialValues.experience || "");
    const [education, setEducation] = useState(initialValues.education || "");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!fullName.trim()) newErrors.fullName = "Full Name is required";
        if (!email.trim()) newErrors.email = "Email is required";
        if (!phone.trim()) newErrors.phone = "Phone is required";
        // Simple phone validation for future call support
        if (phone && !/^\+?[0-9\-\s]{7,20}$/.test(phone)) newErrors.phone = "Enter a valid phone number";
        if (role === "counsellor") {
            if (!expertise.trim()) newErrors.expertise = "Expertise is required";
            if (!experience.trim()) newErrors.experience = "Experience is required";
            if (!education.trim()) newErrors.education = "Education is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.size > maxSize) {
                toast({
                    title: "Image size should not exceed 10MB.",
                    variant: "destructive",
                });
                return;
            }
            setProfilePicFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        const payload = {
            full_name: fullName,
            profile_image: "https://static.vecteezy.com/system/resources/thumbnails/000/439/863/small/Basic_Ui__28186_29.jpg",
            email: email,
            phone: phone,
            role: role,
        };
        try {
            const response = await fetch("https://interactapiverse.com/mahadevasth/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error("Failed to add user");
            }
            toast({
                title: "User added successfully!",
                description: "User has been added to the system.",
            });
            onSubmit({
                fullName,
                profilePic: payload.profile_image,
                email,
                phone,
                role,
            } as UserFormValues);
        } catch (error: any) {
            toast({
                title: error.message || "An error occurred while adding the user.",
                variant: "destructive",
            });
        }
    };

    const {toast} = useToast();

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
                <form
                    className="space-y-8"
                    onSubmit={handleSubmit}
                    autoComplete="off"
                >
                    <div className="flex flex-row items-start gap-20">
                        <div className="flex flex-col items-center min-w-[120px] pt-2">
                            <Avatar className="h-36 w-36 overflow-hidden rounded-full">
                                {profilePic ? (
                                    <img
                                        src={profilePic}
                                        alt="Profile Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <AvatarFallback className="bg-[#012765] text-white text-5xl">
                                        {fullName?.[0]?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <Button
                                type="button"
                                variant="outline"
                                className="mt-7 font-normal px-4 py-2"
                                onClick={() =>
                                    document.getElementById("user-profile-pic")?.click()
                                }
                            >
                                Change Avatar
                            </Button>
                            <Input
                                id="user-profile-pic"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleProfilePicChange}
                            />
                            <span className="text-xs text-gray-500 mt-1">
                JPG, GIF or PNG. <strong>10MB max.</strong>
              </span>
                        </div>
                        <div className="flex-1 w-full space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="user-full-name" className="font-semibold">
                                        Full Name
                                    </Label>
                                    <Input
                                        id="user-full-name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Full Name"
                                    />
                                    {errors.fullName && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.fullName}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="user-email" className="font-semibold">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="user-email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email Address"
                                    />
                                    {errors.email && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="user-phone" className="font-semibold">
                                    Phone
                                </Label>
                                <Input
                                    id="user-phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Phone Number"
                                    inputMode="tel"
                                    autoComplete="tel"
                                />
                                {errors.phone && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {errors.phone}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="user-role" className="font-semibold">
                                    Role
                                </Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {role === "counsellor" && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="user-expertise" className="font-semibold">
                                            Expertise
                                        </Label>
                                        <Input
                                            id="user-expertise"
                                            value={expertise}
                                            onChange={(e) => setExpertise(e.target.value)}
                                            placeholder="Expertise"
                                        />
                                        {errors.expertise && (
                                            <div className="text-red-500 text-xs mt-1">
                                                {errors.expertise}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="user-experience" className="font-semibold">
                                            Experience
                                        </Label>
                                        <Input
                                            id="user-experience"
                                            value={experience}
                                            onChange={(e) => setExperience(e.target.value)}
                                            placeholder="Experience"
                                        />
                                        {errors.experience && (
                                            <div className="text-red-500 text-xs mt-1">
                                                {errors.experience}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="user-education" className="font-semibold">
                                            Education
                                        </Label>
                                        <Input
                                            id="user-education"
                                            value={education}
                                            onChange={(e) => setEducation(e.target.value)}
                                            placeholder="Education"
                                        />
                                        {errors.education && (
                                            <div className="text-red-500 text-xs mt-1">
                                                {errors.education}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="pt-2 flex justify-end">
                                {onCancel && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onCancel}
                                        className="mr-2 px-6 py-2 rounded-md font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    className="bg-[#012765] text-white px-6 py-2 rounded-md font-semibold shadow transition-all duration-150"
                                >
                                    {mode === "edit" ? "Save Changes" : "Add User"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
