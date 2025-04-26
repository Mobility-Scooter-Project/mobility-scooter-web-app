import type { FileUpload } from "@mjackson/form-data-parser";

/**
 * Converts a FileUpload stream into a File object.
 * 
 * @param fileUpload - The FileUpload object containing the file stream and metadata
 * @returns Promise<File> A File object created from the upload stream
 * 
 * @example
 * ```typescript
 * const upload = await uploadHandler(fileUpload);
 * // upload is now a File object that can be used for further processing
 * ```
 */
export const uploadHandler = async (fileUpload: FileUpload) => {
    const fileStream = fileUpload.stream()
    const blob = await new Response(fileStream).blob();

    return new File([blob], fileUpload.name, {
        type: fileUpload.type,
    });
};