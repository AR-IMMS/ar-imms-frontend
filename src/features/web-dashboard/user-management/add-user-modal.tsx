"use client";

import { useEffect, useState } from "react";
import { useCreateUserMutation } from "@/hooks/identity/use-identity-mutations";
import { toast } from "sonner";
import type { RoleCode, CreateUserRequestPayload } from "@/types/auth";
import ModalLayout from "@/components/layout/modal-layout";
import IdentityFields from "./components/identity-fields";
import RoleSelector from "./components/role-selector";
import UserPreview from "./components/user-preview";

interface AddUserModalProps {
  onClose: () => void;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  department?: string;
  roleCodes?: string;
  apiError?: string;
}

interface FormDataState {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  department: string;
  avatarUrl: string;
}

export default function AddUserModal({ onClose }: AddUserModalProps) {
  const createUserMutation = useCreateUserMutation();

  // Form states
  const [formData, setFormData] = useState<FormDataState>({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    jobTitle: "",
    department: "",
    avatarUrl: "",
  });
  const [selectedRoles, setSelectedRoles] = useState<RoleCode[]>([]);

  // Validation & error states
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingText, setLoadingText] = useState("PROCESSING...");

  // Monospace animated text loader for button
  useEffect(() => {
    if (!createUserMutation.isPending) return;
    const frames = ["PROCESSING.  ", "PROCESSING.. ", "PROCESSING..."];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingText(frames[i % frames.length]);
      i++;
    }, 400);
    return () => clearInterval(interval);
  }, [createUserMutation.isPending]);

  // Toggle role selection
  const handleRoleToggle = (role: RoleCode) => {
    setSelectedRoles((prev) => {
      const isSelected = prev.includes(role);
      const next = isSelected
        ? prev.filter((r) => r !== role)
        : [...prev, role];
      // Clear error if selection is made
      if (next.length > 0 && errors.roleCodes) {
        setErrors((err) => ({ ...err, roleCodes: undefined }));
      }
      return next;
    });
  };

  const handleInputChange = (field: keyof FormDataState, value: string) => {
    let cleanValue = value;

    // Logic đặc thù xử lý dọn dẹp kí tự của username trực tiếp khi gõ
    if (field === "username") {
      cleanValue = value.replace(/[^a-zA-Z0-9_-]/g, "");
    }

    setFormData((prev) => ({ ...prev, [field]: cleanValue }));

    // Tự động xóa lỗi của trường đó nếu người dùng bắt đầu nhập lại dữ liệu
    const errorKey = field as keyof FormErrors;
    if (errors[errorKey]) {
      setErrors((err) => ({ ...err, [errorKey]: undefined }));
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createUserMutation.isPending) return;

    // Reset API error
    setErrors((err) => ({ ...err, apiError: undefined }));

    const newErrors: FormErrors = {};
    const {
      fullName,
      username,
      email,
      phoneNumber,
      jobTitle,
      department,
      avatarUrl,
    } = formData;

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!username.trim()) {
      newErrors.username = "Username is required.";
    } else if (/\s/.test(username) || !/^[a-zA-Z0-9_-]+$/.test(username)) {
      newErrors.username =
        "Username must not contain spaces or special characters.";
    }

    const emailLower = email.trim().toLowerCase();
    const isEmailValidPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower);
    const endsWithAllowedDomain =
      emailLower.endsWith("@gmail.com") || emailLower.endsWith("@arimms.io");

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!isEmailValidPattern) {
      newErrors.email = "Must be a valid email address.";
    } else if (!endsWithAllowedDomain) {
      newErrors.email =
        "Organization email must end with @gmail.com or @arimms.io.";
    }

    if (selectedRoles.length === 0) {
      newErrors.roleCodes = "At least one role must be selected.";
    }

    // Set errors and abort if invalid
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please correct the highlighted fields.");
      return;
    }

    // Construct final payload
    const payload: CreateUserRequestPayload = {
      username: username.trim(),
      email: email.trim(),
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      department: department.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      roleCodes: selectedRoles,
    };

    try {
      await createUserMutation.mutateAsync(payload);
      onClose();
    } catch (err) {
      console.error("AddUserModal submit failure:", err);
      let errorMsg = "Failed to create user. Please try again.";
      let targetField: keyof FormErrors = "apiError";

      // Try parsing the error payload
      if (err && typeof err === "object") {
        const errorWithMsg = err as {
          message?: string;
          json?: () => Promise<unknown>;
        };
        const rawMsg = errorWithMsg.message || "";
        errorMsg = rawMsg;

        if (rawMsg.toLowerCase().includes("email")) {
          targetField = "email";
        } else if (rawMsg.toLowerCase().includes("username")) {
          targetField = "username";
        } else if (rawMsg.toLowerCase().includes("name")) {
          targetField = "fullName";
        }

        try {
          if (typeof errorWithMsg.json === "function") {
            const jsonErr = (await errorWithMsg.json()) as {
              error?: { message?: string };
              message?: string;
              details?: { message?: string };
            };
            const detailMsg =
              jsonErr?.error?.message ||
              jsonErr?.message ||
              jsonErr?.details?.message;
            if (detailMsg) {
              errorMsg = detailMsg;
              if (detailMsg.toLowerCase().includes("email")) {
                targetField = "email";
              } else if (detailMsg.toLowerCase().includes("username")) {
                targetField = "username";
              }
            }
          }
        } catch {
          // Ignore
        }
      }

      setErrors((prev) => ({
        ...prev,
        [targetField]: errorMsg,
        ...(targetField !== "apiError" ? { apiError: errorMsg } : {}),
      }));
      toast.error(errorMsg);
    }
  };

  return (
    <ModalLayout
      onClose={onClose}
      eyebrow="// CREATE ACCOUNT"
      title="Add New Infrastructure Operator"
      isPending={createUserMutation.isPending}
    >
      {/* Modal Content - 2 Column Layout */}
      <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
        {/* Left Column: Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 border-r-0 border-[#25304A] p-6 md:col-span-7 md:border-r"
        >
          {/* Section: Operator Metadata */}
          <IdentityFields
            {...formData}
            errors={errors}
            isPending={createUserMutation.isPending}
            onFullNameChange={(val) => handleInputChange("fullName", val)}
            onUsernameChange={(val) => handleInputChange("username", val)}
            onEmailChange={(val) => handleInputChange("email", val)}
            onPhoneNumberChange={(val) => handleInputChange("phoneNumber", val)}
            onJobTitleChange={(val) => handleInputChange("jobTitle", val)}
            onDepartmentChange={(val) => handleInputChange("department", val)}
            onAvatarUrlChange={(val) => handleInputChange("avatarUrl", val)}
          />

          {/* Section: Roles Selection */}
          <RoleSelector
            selectedRoles={selectedRoles}
            onRoleToggle={handleRoleToggle}
            errors={errors}
            isPending={createUserMutation.isPending}
          />

          {/* Actions Bar */}
          <div className="mt-2 flex items-center justify-center gap-3 border-t border-[#25304A] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={createUserMutation.isPending}
              className="label-mono h-9 rounded-md border border-[#25304A] bg-transparent px-4 py-2 text-[10px] text-muted-foreground hover:bg-white/5 hover:text-foreground transition disabled:opacity-50"
            >
              Cancel Action
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="label-mono h-9 rounded-md bg-[#009DFF] px-5 py-2 text-[10px] text-white hover:bg-[#008be2] hover:shadow-[0_0_15px_rgba(0,157,255,0.4)] transition disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center font-semibold"
            >
              {createUserMutation.isPending ? (
                <span className="font-mono">{loadingText}</span>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Live Profile Preview */}
        <UserPreview {...formData} selectedRoles={selectedRoles} />
      </div>
    </ModalLayout>
  );
}
