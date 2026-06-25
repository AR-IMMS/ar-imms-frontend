export default function buildQueryString(
  params?: Record<string, unknown> | object,
): string {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    // Loại bỏ các giá trị không hợp lệ hoặc chuỗi rỗng
    if (value === undefined || value === null || value === "") {
      return;
    }

    // Xử lý trường hợp là mảng
    if (Array.isArray(value)) {
      // Nếu mảng rỗng [] thì bỏ qua không xử lý tiếp
      if (value.length === 0) return;

      value.forEach((item) => {
        // Chỉ append nếu phần tử bên trong mảng không phải chuỗi rỗng/null/undefined
        if (item !== "" && item !== null && item !== undefined) {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    // Xử lý giá trị primitive đơn lẻ (string, number, boolean)
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
