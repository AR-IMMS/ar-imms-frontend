"use client";

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  department?: string;
  roleCodes?: string;
  apiError?: string;
}

interface IdentityFieldsProps {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  department: string;
  avatarUrl: string;
  errors: FormErrors;
  isPending: boolean;
  onFullNameChange: (val: string) => void;
  onUsernameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onPhoneNumberChange: (val: string) => void;
  onJobTitleChange: (val: string) => void;
  onDepartmentChange: (val: string) => void;
  onAvatarUrlChange: (val: string) => void;
}

export default function IdentityFields({
  fullName,
  username,
  email,
  phoneNumber,
  jobTitle,
  department,
  avatarUrl,
  errors,
  isPending,
  onFullNameChange,
  onUsernameChange,
  onEmailChange,
  onPhoneNumberChange,
  onJobTitleChange,
  onDepartmentChange,
  onAvatarUrlChange,
}: IdentityFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="title-display text-[10px] tracking-wider text-cyan-ice">
        Primary Identity Context
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="label-mono text-[9px] text-muted-foreground">
            Full Name <span className="text-[#ff4d6d]">*</span>
          </label>
          <input
            type="text"
            disabled={isPending}
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="E.g., Lena Okafor"
            className={`h-9 w-full rounded-md border bg-[#0b1020] px-3 font-mono text-xs text-foreground outline-none transition-all duration-200 ${
              errors.fullName
                ? "border-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.2)]"
                : "border-[#25304A] focus:border-[#009DFF] focus:shadow-[0_0_10px_rgba(0,157,255,0.15)]"
            }`}
          />
          {errors.fullName && (
            <span className="text-[10px] text-[#ff4d6d]">{errors.fullName}</span>
          )}
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="label-mono text-[9px] text-muted-foreground">
            Username <span className="text-[#ff4d6d]">*</span>
          </label>
          <input
            type="text"
            disabled={isPending}
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="alpha_numeric-only"
            className={`h-9 w-full rounded-md border bg-[#0b1020] px-3 font-mono text-xs text-foreground outline-none transition-all duration-200 ${
              errors.username
                ? "border-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.2)]"
                : "border-[#25304A] focus:border-[#009DFF] focus:shadow-[0_0_10px_rgba(0,157,255,0.15)]"
            }`}
          />
          {errors.username && (
            <span className="text-[10px] text-[#ff4d6d]">{errors.username}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="label-mono text-[9px] text-muted-foreground">
            Email Address <span className="text-[#ff4d6d]">*</span>
          </label>
          <input
            type="text"
            disabled={isPending}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="name@gmail.com"
            className={`h-9 w-full rounded-md border bg-[#0b1020] px-3 font-mono text-xs text-foreground outline-none transition-all duration-200 ${
              errors.email
                ? "border-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.2)]"
                : "border-[#25304A] focus:border-[#009DFF] focus:shadow-[0_0_10px_rgba(0,157,255,0.15)]"
            }`}
          />
          {errors.email && (
            <span className="text-[10px] text-[#ff4d6d]">{errors.email}</span>
          )}
        </div>

        {/* Phone Number (Optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="label-mono text-[9px] text-muted-foreground">
            Phone Number (Optional)
          </label>
          <input
            type="text"
            disabled={isPending}
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="h-9 w-full rounded-md border border-[#25304A] bg-[#0b1020] px-3 font-mono text-xs text-foreground outline-none transition-all duration-200 focus:border-[#009DFF] focus:shadow-[0_0_10px_rgba(0,157,255,0.15)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Department */}
        <div className="flex flex-col gap-1.5">
          <label className="label-mono text-[9px] text-muted-foreground">
            Department (Optional)
          </label>
          <input
            type="text"
            disabled={isPending}
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            placeholder="E.g., Infrastructure, IT Support"
            className={`h-9 w-full rounded-md border bg-[#0b1020] px-3 font-mono text-xs text-foreground outline-none transition-all duration-200 ${
              errors.department
                ? "border-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.2)]"
                : "border-[#25304A] focus:border-[#009DFF] focus:shadow-[0_0_10px_rgba(0,157,255,0.15)]"
            }`}
          />
          {errors.department && (
            <span className="text-[10px] text-[#ff4d6d]">{errors.department}</span>
          )}
        </div>

        {/* Job Title (Optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="label-mono text-[9px] text-muted-foreground">
            Job Title (Optional)
          </label>
          <input
            type="text"
            disabled={isPending}
            value={jobTitle}
            onChange={(e) => onJobTitleChange(e.target.value)}
            placeholder="E.g., Senior Systems Analyst"
            className="h-9 w-full rounded-md border border-[#25304A] bg-[#0b1020] px-3 font-mono text-xs text-foreground outline-none transition-all duration-200 focus:border-[#009DFF] focus:shadow-[0_0_10px_rgba(0,157,255,0.15)]"
          />
        </div>
      </div>

      {/* Avatar URL (Optional) */}
      <div className="flex flex-col gap-1.5">
        <label className="label-mono text-[9px] text-muted-foreground">
          Avatar Image URL (Optional)
        </label>
        <input
          type="text"
          disabled={isPending}
          value={avatarUrl}
          onChange={(e) => onAvatarUrlChange(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          className="h-9 w-full rounded-md border border-[#25304A] bg-[#0b1020] px-3 font-mono text-xs text-foreground outline-none transition-all duration-200 focus:border-[#009DFF] focus:shadow-[0_0_10px_rgba(0,157,255,0.15)]"
        />
      </div>
    </div>
  );
}
