import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, X } from "lucide-react";
import { Card } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import { useArticleCategories } from "@/hooks/useArticleCategories.tsx";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

type ResourceFormErrors = {
  title?: string;
  author?: string;
  type?: string;
  category_name?: string;
  platform?: string;
  age?: string;
  description?: string;
  tags?: string;
  thumbnail?: string;
  emptyImage?: string;
  file?: string;
};

const getInitialForm = () => ({
  title: "",
  author: "",
  type: "",
  category_name: "",
  description: "",
  tags: [],
  thumbnail: null,
  emptyImage: null,
  file: null,
  platform: "",
  age: "",
  status: "published",
  resource_status: "Live",
  admin_approval: "approved",
  premium: "premium",
});

const getTagsArray = (tags: any) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      return JSON.parse(tags);
    } catch {
      return tags.split(",").map((t) => t.trim());
    }
  }
  return [];
};

const platforms = [
  { value: "Web", label: "web" },
  { value: "App", label: "app" },
  { value: "Both", label: "both" },
];

const ages = ["13+", "14+", "16+", "18+"];

const resourceStatusOptions = [
  { value: "Live", label: "Live" },
  { value: "Hide", label: "Hide" },
  { value: "Draft", label: "Draft" },
];

const statusOptions = [
  { value: "Published", label: "Published" },
  { value: "Unpublished", label: "Unpublished" },
];

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ResourceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isView = new URLSearchParams(location.search).get("view") === "1";
  const [form, setForm] = useState(getInitialForm());
  const [tagInput, setTagInput] = useState("");
  const [emptyPreview, setEmptyPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ResourceFormErrors>({});
  const emptyInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const type = sessionStorage.getItem("resourceType") || "article";

  // API states
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Categories states
  const { categories, categoriesLoading, categoriesError } =
    useArticleCategories();

  // Counsellors state
  const [counsellors, setCounsellors] = useState<
    { full_name: string; user_id: number }[]
  >([]);
  const [counsellorsLoading, setCounsellorsLoading] = useState(false);
  const [counsellorsError, setCounsellorsError] = useState<string | null>(null);

  // Load resource for edit/view
  useEffect(() => {
    const fetchResource = async () => {
      if (!id) return;

      setIsLoading(true);
      setApiError(null);
      try {
        const endpoint =
          type === "video"
            ? `https://interactapiverse.com/mahadevasth/shape/videos/${id}`
            : `https://interactapiverse.com/mahadevasth/shape/articles/${id}`;

        const response = await axios.get(endpoint);
        const data = response.data?.data?.[0] || response.data;

        setForm({
          title: data.title || "",
          author: data.counsellor_name || data.author || "",
          type: type,
          category_name: data.category_name || data.category || "",
          description: data.article || data.description || "",
          tags: getTagsArray(data.tags),
          thumbnail: data.image || null,
          emptyImage: data.image || null,
          file: type === "video" ? data.file || null : null,
          platform: data.platform || "",
          age: data.audience_age || data.age || "",
          status: data.status,
          resource_status: data.resource_status,
          admin_approval: "pending",
          premium: data.premium,
        });

        setEmptyPreview(data.image || null);
        if (type === "video") {
          setThumbnailPreview(data.image || null);
        } else {
          setEmptyPreview(data.image || null);
        }
      } catch (error) {
        setApiError("Failed to fetch resource from API");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResource();
  }, [id, isView, type]);

  // Fetch counsellors on mount
  useEffect(() => {
    const fetchCounsellors = async () => {
      setCounsellorsLoading(true);
      setCounsellorsError(null);
      try {
        const response = await axios.get(
          "https://interactapiverse.com/mahadevasth/counsellors"
        );
        let data = response.data?.data || response.data;
        if (Array.isArray(data)) {
          setCounsellors(
            data.filter(
              (c) => c && typeof c.full_name === "string" && c.full_name
            )
          );
        } else {
          setCounsellors([]);
        }
      } catch (err) {
        setCounsellorsError("Failed to load counsellors");
        setCounsellors([]);
      } finally {
        setCounsellorsLoading(false);
      }
    };
    fetchCounsellors();
  }, []);

  const getSelectedCategoryId = () => {
    const cat = categories.find((c) => c.category === form.category_name);
    return cat ? cat.id : undefined;
  };

  const getSelectedCounsellorId = () => {
    const counsellor = counsellors.find((c) => c.full_name === form.author);
    return counsellor ? counsellor.user_id : undefined;
  };

  // Form Handlers
  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.id]: e.target.value }));
  };

  const handleSelect = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleFile = async (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        (field === "thumbnail" || field === "emptyImage") &&
        file.size > 1 * 1024 * 1024
      ) {
        setApiError("Image size should be less than 1MB");
        return;
      }

      if (field === "file") {
        try {
          setIsUploading(true);
          setUploadProgress(0);
          // Video direct S3 upload with progress tracking
          // Ensure filename is a string
          const filename = file.name || `video_${Date.now()}.mp4`;

          // Try FormData format first (some APIs expect this)
          const formData = new FormData();
          formData.append("filename", filename);

          const presignRes = await axios.post(
            "https://interactapiverse.com/mahadevasth/shape/videos/upload-url",
            formData
          );
          const uploadUrl = presignRes.data?.data?.upload_url;
          await axios.put(uploadUrl, file, {
            headers: { "Content-Type": file.type },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress(percentCompleted);
              }
            },
          });
          setForm((f) => ({
            ...f,
            [field]: { ...file, ...presignRes.data?.data, filename: filename },
          }));
          setFilePreview(URL.createObjectURL(file));
          setUploadProgress(100);
        } catch (error) {
          console.error("Upload failed:", error);
          if (axios.isAxiosError(error) && error.response) {
            const errorMsg =
              error.response.data?.message ||
              error.response.data?.data ||
              "Video upload failed. Please try again.";
            setApiError(errorMsg);
          } else {
            setApiError("Video upload failed. Please try again.");
          }
          setUploadProgress(0);
        } finally {
          setIsUploading(false);
        }
      } else if (field === "thumbnail") {
        // For thumbnail, just store the File object and a preview
        setForm((f) => ({ ...f, thumbnail: file }));
        setThumbnailPreview(URL.createObjectURL(file)); // For preview, if you want
      } else if (field === "emptyImage") {
        // For article thumbnails, store file (optional: update for your API)
        setForm((f) => ({ ...f, emptyImage: file }));
        setEmptyPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleThumbnailChange = async (
    _field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const field = _field;
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(field, e);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        setForm((f) => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t: string) => t !== tag) }));
  };

  const handleRemoveThumbnail = () => {
    setEmptyPreview(null);
    setForm((f) => ({ ...f, emptyImage: null }));
    if (emptyInputRef.current) emptyInputRef.current.value = "";
  };

  const handleRemoveFile = () => {
    setFilePreview(null);
    setForm((f) => ({ ...f, file: null }));
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Validation
  const validateForm = () => {
    const newErrors: ResourceFormErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.author.trim()) newErrors.author = "Author is required";
    if (!form.category_name) newErrors.category_name = "Category is required";
    if (!form.platform) newErrors.platform = "Platform is required";
    if (!form.age.trim()) newErrors.age = "Age is required";
    if (type === "article" && !form.description.trim())
      newErrors.description = "Description is required";
    if (!form.tags || form.tags.length === 0)
      newErrors.tags = "At least one tag is required";
    if (type === "video" && !form.file)
      newErrors.file = "Video file is required";
    if (type === "video" && !form.type) newErrors.type = "Type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save to API
  // Save to API
  const saveToAPI = async (isDraft: boolean = false) => {
    setIsLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      // Normalize image file
      const imageFile =
        form?.thumbnail instanceof File
          ? form.thumbnail
          : form?.emptyImage instanceof File
          ? form.emptyImage
          : null;

      if (type === "video") {
        // Prepare formdata for video upload (includes file + thumbnail as file)
        const formData = new FormData();
        formData.append("s3_key", form?.file?.s3_key ?? "");
        formData.append("original_filename", form?.file?.filename ?? "");
        formData.append("title", form?.title ?? "");
        formData.append("age", form?.age ?? "");
        formData.append("category", form?.category_name ?? "");
        formData.append("tags", JSON.stringify(form?.tags));
        formData.append("platform", form?.platform ?? "");
        formData.append("author", form?.author ?? "");
        formData.append("created_at", new Date().toISOString());
        formData.append("type", form?.type ?? "");
        formData.append("content_type", "video/mp4");
        formData.append("premium", form?.premium);

        if (imageFile) {
          formData.append("thumbnail", imageFile);
        }

        let response;
        if (id) {
          response = await axios.put(
            `https://interactapiverse.com/mahadevasth/shape/videos/${id}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        } else {
          response = await axios.post(
            "https://interactapiverse.com/mahadevasth/shape/upload",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        }

        setApiSuccess(
          id ? "Video updated successfully!" : "Video uploaded successfully!"
        );
      } else {
        // ARTICLE BRANCH — FIXED
        const formData = new FormData();

        formData.append("title", form.title);
        formData.append("article", form.description);
        formData.append(
          "counsellor_code",
          getSelectedCounsellorId()?.toString() || ""
        );
        formData.append("type", "article");
        formData.append("category", getSelectedCategoryId()?.toString() || "");
        formData.append("platform", form.platform);
        formData.append("audience_age", form.age);
        formData.append("status", form.status || "published");
        formData.append("tags", JSON.stringify(form.tags || []));
        formData.append(
          "resource_status",
          isDraft ? "draft" : form.resource_status
        );
        formData.append("admin_approval", "pending");

        // FIXED → Always send correct image file
        if (imageFile) {
          formData.append("image", imageFile);
        }

        if (id) formData.append("id", id);

        let response;
        if (id) {
          response = await axios.put(
            `https://interactapiverse.com/mahadevasth/shape/articles/${id}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        } else {
          response = await axios.post(
            "https://interactapiverse.com/mahadevasth/shape/articles/upload",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        }

        setApiSuccess(
          id ? "Article updated successfully!" : "Article created successfully!"
        );
      }

      setTimeout(
        () => navigate(type === "video" ? "/videos" : "/resources"),
        2000
      );
    } catch (error) {
      console.error("API Error:", error);
      let errorMsg = `Failed to save ${type}`;
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || error.message;
      }
      setApiError(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();

    // Validate form first - if validation fails, do not call API
    const isValid = validateForm();
    if (!isValid) {
      // Validation errors are already set by validateForm
      return;
    }

    // Only proceed with API call if validation passes
    try {
      await saveToAPI(isDraft);
    } catch (error) {
      console.log(error);
      // If API fails, you could implement a fallback to local storage here if needed
    }
  };

  return (
    <div>
      <Button variant="outline" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div>
          <h1 className="text-3xl font-bold text-[#FF7119] mb-2 text-center md:text-left">
            {isView
              ? `${type === "video" ? "Video" : "Resource"} Details`
              : id
              ? `Edit ${type === "video" ? "Video" : "Resource"}`
              : `Add New ${type === "video" ? "Video" : "Resource"}`}
          </h1>
          <p className="text-gray-600 mb-5 text-center md:text-left">
            {isView
              ? `View all details for this ${type}.`
              : "Fill in the details below."}
          </p>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {apiError}
            </div>
          )}

          {apiSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              <strong>Success:</strong> {apiSuccess}
            </div>
          )}

          <Card className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Title</Label>
                {isView ? (
                  <div className="py-2 px-3 bg-gray-50 rounded border text-gray-800">
                    {form.title}
                  </div>
                ) : (
                  <Input
                    id="title"
                    value={form.title}
                    onChange={handleInput}
                    placeholder={
                      type === "video" ? "Video title..." : "Resource title..."
                    }
                    className={errors.title ? "border-red-500" : ""}
                  />
                )}
                {errors.title && !isView && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.title}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                {isView ? (
                  <div className="py-2 px-3 bg-gray-50 rounded border text-gray-800">
                    {form.category_name || "-"}
                  </div>
                ) : (
                  <Select
                    value={form.category_name}
                    onValueChange={(v) => handleSelect("category_name", v)}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          categoriesLoading ? "Loading..." : "Select category"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesError && (
                        <div className="text-red-500 text-xs p-2">
                          {categoriesError}
                        </div>
                      )}
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.category}>
                          {cat.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.category_name && !isView && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.category_name}
                  </div>
                )}
              </div>

              {type === "video" && (
                <div className="flex flex-col gap-2">
                  <Label>Type</Label>
                  {isView ? (
                    <div className="py-2 px-3 bg-gray-50 rounded border text-gray-800">
                      {form.type || "-"}
                    </div>
                  ) : (
                    <Select
                      value={form.type}
                      onValueChange={(v) => handleSelect("type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={"Select type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          { label: "Session", value: "session" },
                          { label: "Shorts", value: "shorts" },
                        ].map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.type && !isView && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors?.type}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label>Author</Label>
                {isView ? (
                  <div className="py-2 px-3 bg-gray-50 rounded border text-gray-800">
                    {form.author}
                  </div>
                ) : (
                  <Select
                    value={form.author}
                    onValueChange={(v) => handleSelect("author", v)}
                    disabled={counsellorsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          counsellorsLoading ? "Loading..." : "Select author"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {counsellorsError && (
                        <div className="text-red-500 text-xs p-2">
                          {counsellorsError}
                        </div>
                      )}
                      {counsellors.map((c) => (
                        <SelectItem key={c.user_id} value={c.full_name}>
                          {c.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.author && !isView && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.author}
                  </div>
                )}
              </div>

              {type === "video" ? (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label>Video File</Label>
                  {filePreview ? (
                    <div className="relative mt-2 w-full max-w-md">
                      <video
                        src={filePreview}
                        controls
                        className="w-full h-40 object-cover rounded"
                      />
                      {!isView && (
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100 border border-gray-300"
                          onClick={handleRemoveFile}
                          aria-label="Remove video"
                        >
                          <X className="w-4 h-4 text-gray-700" />
                        </button>
                      )}
                    </div>
                  ) : isView ? (
                    <div className="py-2 px-3 text-gray-400">No video</div>
                  ) : (
                    <>
                      <Input
                        id="file"
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFile("file", e)}
                        ref={fileInputRef}
                        disabled={isUploading}
                      />
                      {isUploading && (
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Uploading video...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        MP4, MOV or AVI
                      </div>
                      {errors.file && (
                        <div className="text-red-500 text-xs mt-1">
                          {errors.file}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label>Thumbnail Image</Label>
                  {emptyPreview ||
                  (form.emptyImage && typeof form.emptyImage === "string") ? (
                    <div className="relative mt-2 w-full max-w-md">
                      <img
                        src={
                          emptyPreview ||
                          (typeof form.emptyImage === "string"
                            ? form.emptyImage
                            : "")
                        }
                        alt="Thumbnail Preview"
                        className="w-full h-40 object-cover rounded"
                      />
                      {!isView && (
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100 border border-gray-300"
                          onClick={() => {
                            setForm((f) => ({ ...f, emptyImage: null }));
                            setEmptyPreview(null);
                          }}
                          aria-label="Remove thumbnail"
                        >
                          <X className="w-4 h-4 text-gray-700" />
                        </button>
                      )}
                    </div>
                  ) : isView ? (
                    <div className="py-2 px-3 text-gray-400">No thumbnail</div>
                  ) : (
                    <>
                      <Input
                        id="emptyImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFile("emptyImage", e)}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        JPG, PNG or GIF. 1MB max.
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label>Platform</Label>
                {isView ? (
                  <div className="py-2 px-3 bg-gray-50 rounded border text-gray-800">
                    {platforms.find(
                      (p) =>
                        p.value.toLowerCase() === form.platform.toLowerCase()
                    )?.label || form.platform}
                  </div>
                ) : (
                  <Select
                    value={form.platform}
                    onValueChange={(v) => handleSelect("platform", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.platform && !isView && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.platform}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Age</Label>
                {isView ? (
                  <div className="py-2 px-3 bg-gray-50 rounded border text-gray-800">
                    {form.age}
                  </div>
                ) : (
                  <Select
                    value={form.age}
                    onValueChange={(v) => handleSelect("age", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age" />
                    </SelectTrigger>
                    <SelectContent>
                      {ages.map((age) => (
                        <SelectItem key={age} value={age}>
                          {age}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.age && !isView && (
                  <div className="text-red-500 text-xs mt-1">{errors.age}</div>
                )}
              </div>

              {type === "video" && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label>Thumbnail Image</Label>
                    {thumbnailPreview ||
                    (form.thumbnail && typeof form.thumbnail === "string") ? (
                      <div className="relative mt-2 w-full max-w-md">
                        <img
                          src={
                            thumbnailPreview ||
                            (typeof form.thumbnail === "string"
                              ? form.thumbnail
                              : "")
                          }
                          alt="Thumbnail Preview"
                          className="w-full h-40 object-cover rounded"
                        />
                        {!isView && (
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100 border border-gray-300"
                            onClick={() => {
                              setForm((f) => ({ ...f, thumbnail: null }));
                              setThumbnailPreview(null);
                            }}
                            aria-label="Remove thumbnail"
                          >
                            <X className="w-4 h-4 text-gray-700" />
                          </button>
                        )}
                      </div>
                    ) : isView ? (
                      <div className="py-2 px-3 text-gray-400">
                        No thumbnail
                      </div>
                    ) : (
                      <>
                        <Input
                          id="thumbnail"
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleThumbnailChange("thumbnail", e)
                          }
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          JPG, PNG or GIF. 1MB max.
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Premium</Label>
                    {isView ? (
                      <div className="py-2 px-3 bg-gray-50 rounded border text-gray-800">
                        {form.premium === "premium" ? "Premium" : "Open to All"}
                      </div>
                    ) : (
                      <Select
                        value={form.premium}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, premium: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select premium type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="open to all">
                            Open to All
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </>
              )}

              {type === "article" && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label>Resource Status</Label>
                    {isView ? (
                      <div className="py-2 px-3 bg-gray-50 rounded border text-gray-800">
                        {resourceStatusOptions.find(
                          (s) => s.value === form.resource_status
                        )?.label || form.resource_status}
                      </div>
                    ) : (
                      <Select
                        value={form.resource_status}
                        onValueChange={(v) =>
                          handleSelect("resource_status", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select resource status" />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceStatusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Status</Label>
                    {isView ? (
                      <div className="py-2 px-3 bg-gray-50 rounded border text-gray-800">
                        {statusOptions.find((s) => s.value === form.status)
                          ?.label || form.status}
                      </div>
                    ) : (
                      <Select
                        value={form.status}
                        onValueChange={(v) => handleSelect("status", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>Description</Label>
                    {isView ? (
                      <div className="py-2 px-3 bg-gray-50 rounded border text-gray-800 min-h-[48px]">
                        {form.description}
                      </div>
                    ) : (
                      <>
                        <ReactQuill
                          id="description"
                          value={form.description}
                          onChange={(value) =>
                            setForm((f) => ({ ...f, description: value }))
                          }
                          placeholder="Article description..."
                          className={errors.description ? "ql-error" : ""}
                          style={{ height: "9rem", margin: "0 0 2.4rem 0" }}
                        />
                        {errors.description && (
                          <div className="text-red-500 text-xs mt-1">
                            {errors.description}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2 md:col-span-2">
                <Label>Tags</Label>
                {isView ? (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.tags && form.tags.length > 0 ? (
                      form.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="bg-[#FF7119] text-white px-2 py-1 rounded-full text-xs flex items-center gap-1"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">No tags</span>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="bg-[#FF7119] text-white px-2 py-1 rounded-full text-xs flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            className="ml-1 text-white hover:text-gray-200"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Type a tag and press Enter"
                      className={errors.tags ? "border-red-500" : ""}
                    />
                    {errors.tags && (
                      <div className="text-red-500 text-xs mt-1">
                        {errors.tags}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {!isView && (
              <div className="flex flex-col md:flex-row gap-2 mt-10 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  type="submit"
                  className="bg-[#012765] text-white"
                  disabled={isLoading || (type === "video" && !filePreview)}
                >
                  {isLoading
                    ? type === "video"
                      ? "Uploading..."
                      : "Publishing..."
                    : type === "video"
                    ? "Upload Video"
                    : "Publish Resource"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </form>
    </div>
  );
}
