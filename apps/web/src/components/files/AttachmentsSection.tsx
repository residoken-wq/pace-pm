"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui";
import { Attachment } from "@/lib/api";
import {
    Upload,
    File,
    FileText,
    Image as ImageIcon,
    X,
    Download,
    Trash2,
    Loader2,
    Paperclip
} from "lucide-react";

// File type icons
const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return File;
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) return FileText;
    return File;
};

// Format file size
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// ============================================
// Single Attachment Card
// ============================================
interface AttachmentCardProps {
    attachment: Attachment;
    onDownload: () => void;
    onDelete: () => void;
    deleting?: boolean;
}

function AttachmentCard({ attachment, onDownload, onDelete, deleting }: AttachmentCardProps) {
    const Icon = getFileIcon(attachment.mimeType);
    const isImage = attachment.mimeType?.startsWith("image/");

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onDownload}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Download"
                >
                    <Download className="w-4 h-4" />
                </button>
                <button
                    onClick={onDelete}
                    disabled={deleting}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete"
                >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

// ============================================
// File Upload Area
// ============================================
interface FileUploadAreaProps {
    onFilesSelected: (files: FileList) => void;
    uploading?: boolean;
}

function FileUploadArea({ onFilesSelected, uploading }: FileUploadAreaProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) {
            onFilesSelected(e.dataTransfer.files);
        }
    }, [onFilesSelected]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`relative p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer ${dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
                className="hidden"
            />
            <div className="flex flex-col items-center text-center">
                {uploading ? (
                    <>
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                    </>
                ) : (
                    <>
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Drop files here or click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">Max 50MB per file</p>
                    </>
                )}
            </div>
        </div>
    );
}

// ============================================
// Main Attachments Section (for Task Modal)
// ============================================
interface AttachmentsSectionProps {
    attachments: Attachment[];
    loading?: boolean;
    uploading?: boolean;
    onUpload: (file: File) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onDownload: (id: string) => void;
}

export function AttachmentsSection({
    attachments,
    loading,
    uploading,
    onUpload,
    onDelete,
    onDownload,
}: AttachmentsSectionProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleFilesSelected = async (files: FileList) => {
        for (const file of Array.from(files)) {
            try {
                await onUpload(file);
            } catch (err) {
                console.error("Failed to upload:", file.name, err);
            }
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await onDelete(id);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Attachments</span>
                {attachments.length > 0 && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        {attachments.length}
                    </span>
                )}
            </div>

            <FileUploadArea onFilesSelected={handleFilesSelected} uploading={uploading} />

            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
            ) : attachments.length > 0 ? (
                <div className="mt-3 space-y-2">
                    {attachments.map((attachment) => (
                        <AttachmentCard
                            key={attachment.id}
                            attachment={attachment}
                            onDownload={() => onDownload(attachment.id)}
                            onDelete={() => handleDelete(attachment.id)}
                            deleting={deletingId === attachment.id}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

// Compact variant for inline display
interface AttachmentsInlineProps {
    count: number;
    onClick: () => void;
}

export function AttachmentsInline({ count, onClick }: AttachmentsInlineProps) {
    if (count === 0) return null;

    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
            <Paperclip className="w-3 h-3" />
            {count}
        </button>
    );
}
