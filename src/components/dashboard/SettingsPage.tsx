import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {Separator} from "@/components/ui/separator";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Settings, User, Shield, Bell, Database, Mail} from "lucide-react";
import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useToast} from "@/hooks/use-toast";
import {useUserContext} from "@/UserContext";

export const SettingsPage = () => {
    const {user, updateUser} = useUserContext();
    const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
    const [lastName, setLastName] = useState(user?.name?.split(" ")[1] || "");
    const [email, setEmail] = useState(user?.email || "");
    const [role, setRole] = useState<string>(user?.role || "");
    const [roleOptions, setRoleOptions] = useState<string[]>([]);

    useEffect(() => {
        // Fetch users from localStorage and extract unique roles
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const roles = Array.from(new Set(users.map((u: any) => String(u.role)).filter(Boolean)));
        // If the current user's role is not in the list, add it
        if (user?.role && !roles.includes(user.role)) {
            roles.push(user.role);
        }
        setRoleOptions(roles as string[]);
    }, [user]);

    const handleSave = () => {
        updateUser({
            name: `${firstName} ${lastName}`,
            email,
            role,
        });
        // Optionally show a toast
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[#FF7119]">
                    Settings
                </h1>
                <p className="text-gray-600 mt-2 text-[#012765]">Manage your preferences and system settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Settings */}
                <Card className="border-0 shadow-lg lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <User className="h-5 w-5"/>
                            <span>Profile Settings</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20">
                                <AvatarFallback
                                    className="bg-[#012765] text-white">{(firstName[0] || "U").toUpperCase()}{(lastName[0] || "").toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <Button variant="outline">Change Avatar</Button>
                                <p className="text-sm text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)}/>
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)}/>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}/>
                        </div>

                        <div>
                            <Label htmlFor="role">Role</Label>
                            <div className="px-3 py-2 border rounded bg-gray-50 text-gray-700 font-semibold">
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </div>
                        </div>

                        <Button className="bg-[#012765] text-white" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Bell className="h-5 w-5"/>
                            <span>Notification Preferences</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive email alerts for important events</p>
                            </div>
                            <Switch defaultChecked/>
                        </div>

                        <Separator/>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">New User Registrations</p>
                                <p className="text-sm text-gray-500">Get notified when new users join</p>
                            </div>
                            <Switch defaultChecked/>
                        </div>

                        <Separator/>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">System Alerts</p>
                                <p className="text-sm text-gray-500">Critical system notifications</p>
                            </div>
                            <Switch defaultChecked/>
                        </div>

                        <Separator/>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Weekly Reports</p>
                                <p className="text-sm text-gray-500">Automated weekly summary reports</p>
                            </div>
                            <Switch/>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notification Preferences */}


            {/* System Configuration */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5"/>
                        <span>System Configuration</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="timezone">Default Timezone</Label>
                            <Select defaultValue="utc">
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="utc">UTC</SelectItem>
                                    <SelectItem value="est">Eastern Time</SelectItem>
                                    <SelectItem value="pst">Pacific Time</SelectItem>
                                    <SelectItem value="cst">Central Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="dateFormat">Date Format</Label>
                            <Select defaultValue="mdy">
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                                    <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                            <Input id="sessionTimeout" type="number" defaultValue="60"/>
                        </div>

                        <div>
                            <Label htmlFor="maxFileSize">Max File Upload Size (MB)</Label>
                            <Input id="maxFileSize" type="number" defaultValue="10"/>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Maintenance Mode</p>
                            <p className="text-sm text-gray-500">Enable to temporarily disable user access</p>
                        </div>
                        <Switch/>
                    </div>

                    <Button className="bg-[#012765] text-white">
                        Save Configuration
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

// --- User Data Helpers (API-ready) ---
function getUsers() {
    // TODO: Replace with API call
    return JSON.parse(localStorage.getItem("users") || "[]");
}

function addUser(user: any) {
    // TODO: Replace with API call
    const users = getUsers();
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
}