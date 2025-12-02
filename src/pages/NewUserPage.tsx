import AddEditUserForm, {UserFormValues} from "@/components/dashboard/AddEditUserForm";
import {useNavigate, useLocation} from "react-router-dom";
import {useMemo} from "react";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function NewUserPage() {
    const navigate = useNavigate();
    const query = useQuery();
    const id = query.get("id");

    const users = useMemo(() => JSON.parse(localStorage.getItem("users") || "[]"), []);
    const initialValues = id ? users.find((u: any) => String(u.id) === id) : undefined;
    const isEdit = Boolean(initialValues);

    const handleSubmit = (values: UserFormValues) => {
        let updatedUsers;
        if (isEdit) {
            updatedUsers = users.map((u: any) => u.id === values.id ? {...u, ...values} : u);
        } else {
            updatedUsers = [
                ...users,
                {
                    ...values,
                    id: Date.now(),
                    status: "active",
                    joinDate: new Date().toISOString().slice(0, 10),
                },
            ];
        }
        localStorage.setItem("users", JSON.stringify(updatedUsers));
        navigate("/users");
    };

    return (
        <div className="w-full min-h-screen flex flex-col items-start justify-">
            <div className="w-full ">
                <h1 className="text-3xl font-bold text-[#FF7119] mb-8">{isEdit ? "Edit User" : "Add User"}</h1>
                <div className="bg-white rounded-xl shadow p-10">
                    <AddEditUserForm
                        mode={isEdit ? "edit" : "add"}
                        initialValues={initialValues}
                        onSubmit={handleSubmit}
                        onCancel={() => navigate("/users")}
                    />
                </div>
            </div>
        </div>
    );
} 