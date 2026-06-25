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

export default function AddUserModal({ onClose }: AddUserModalProps) {
  const createUserMutation = useCreateUserMutation();

  // Form states
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<RoleCode[]>([]);

  // Validation & error states
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingText, setLoadingText] = useState("[PROCESSING...]");

  // Monospace animated text loader for button
  useEffect(() => {
    if (!createUserMutation.isPending) return;
    const frames = ["[PROCESSING.  ]", "[PROCESSING.. ]", "[PROCESSING...]"];
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
      const next = isSelected ? prev.filter((r) => r !== role) : [...prev, role];
      // Clear error if selection is made
      if (next.length > 0 && errors.roleCodes) {
        setErrors((err) => ({ ...err, roleCodes: undefined }));
      }
      return next;
    });
  };

  // Input cleaners to clear specific errors on change
  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (errors.fullName) setErrors((err) => ({ ...err, fullName: undefined }));
  };

  const handleUsernameChange = (val: string) => {
    // Prevent spaces and special characters during typing (allow letters, numbers, dash, underscore)
    const cleaned = val.replace(/[^a-zA-Z0-9_-]/g, "");
    setUsername(cleaned);
    if (errors.username) setErrors((err) => ({ ...err, username: undefined }));
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email) setErrors((err) => ({ ...err, email: undefined }));
  };

  const handleDepartmentChange = (val: string) => {
    setDepartment(val);
    if (errors.department) setErrors((err) => ({ ...err, department: undefined }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createUserMutation.isPending) return;

    // Reset API error
    setErrors((err) => ({ ...err, apiError: undefined }));

    const newErrors: FormErrors = {};

    // 1. Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    // 2. Username validation
    if (!username.trim()) {
      newErrors.username = "Username is required.";
    } else if (/\s/.test(username) || !/^[a-zA-Z0-9_-]+$/.test(username)) {
      newErrors.username = "Username must not contain spaces or special characters.";
    }

    // 3. Email validation
    const emailLower = email.trim().toLowerCase();
    const isEmailValidPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower);
    const endsWithAllowedDomain =
      emailLower.endsWith("@gmail.com") || emailLower.endsWith("@arimms.io");

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!isEmailValidPattern) {
      newErrors.email = "Must be a valid email address.";
    } else if (!endsWithAllowedDomain) {
      newErrors.email = "Organization email must end with @gmail.com or @arimms.io.";
    }

    // 5. Roles validation
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
        const errorWithMsg = err as { message?: string; json?: () => Promise<unknown> };
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
              jsonErr?.error?.message || jsonErr?.message || jsonErr?.details?.message;
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
      eyebrow="OPERATOR SUITE // CREATE ACCOUNT"
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
          {errors.apiError && (
            <div className="rounded-lg border border-[#ff4d6d]/30 bg-[#ff4d6d]/10 p-3 text-xs text-[#ff4d6d]">
              <span className="font-semibold uppercase tracking-wider">SYSTEM WARNING: </span>
              {errors.apiError}
            </div>
          )}

          {/* Section: Operator Metadata */}
          <IdentityFields
            fullName={fullName}
            username={username}
            email={email}
            phoneNumber={phoneNumber}
            jobTitle={jobTitle}
            department={department}
            avatarUrl={avatarUrl}
            errors={errors}
            isPending={createUserMutation.isPending}
            onFullNameChange={handleFullNameChange}
            onUsernameChange={handleUsernameChange}
            onEmailChange={handleEmailChange}
            onPhoneNumberChange={setPhoneNumber}
            onJobTitleChange={setJobTitle}
            onDepartmentChange={handleDepartmentChange}
            onAvatarUrlChange={setAvatarUrl}
          />

          {/* Section: Roles Selection */}
          <RoleSelector
            selectedRoles={selectedRoles}
            onRoleToggle={handleRoleToggle}
            errors={errors}
            isPending={createUserMutation.isPending}
          />

          {/* Actions Bar */}
          <div className="mt-2 flex items-center justify-end gap-3 border-t border-[#25304A] pt-4">
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
                "Provision Operator"
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Live Profile Preview */}
        <UserPreview
          fullName={fullName}
          username={username}
          email={email}
          phoneNumber={phoneNumber}
          jobTitle={jobTitle}
          department={department}
          avatarUrl={avatarUrl}
          selectedRoles={selectedRoles}
        />
      </div>
    </ModalLayout>
  );
}
