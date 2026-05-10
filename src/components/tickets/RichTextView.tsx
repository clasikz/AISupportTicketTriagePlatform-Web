"use client";

import { useState, MouseEvent } from "react";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import ImageLightbox from "./ImageLightbox";

interface Props {
    content: string;
    className?: string;
}

export default function RichTextView({ content, className = "" }: Props) {
    const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "IMG") {
            const img = target as HTMLImageElement;
            setLightbox({ src: img.src, alt: img.alt });
        }
    };

    const safe = sanitizeRichHtml(content);

    return (
        <>
            <div
                className={`rte-view text-[13px] text-[#172b4d] ${className}`}
                onClick={handleClick}
                dangerouslySetInnerHTML={{ __html: safe }}
            />
            {lightbox && (
                <ImageLightbox
                    src={lightbox.src}
                    alt={lightbox.alt}
                    onClose={() => setLightbox(null)}
                />
            )}

            <style jsx global>{`
                .rte-view img {
                    max-width: 100%;
                    height: auto;
                    display: inline-block;
                    vertical-align: middle;
                    border-radius: 4px;
                    cursor: zoom-in;
                    transition: filter 150ms ease, transform 150ms ease,
                        box-shadow 150ms ease;
                }
                .rte-view img:hover {
                    filter: brightness(0.96);
                    box-shadow: 0 1px 4px rgba(9, 30, 66, 0.2);
                }
                .rte-view p {
                    margin: 0 0 0.5em 0;
                }
                .rte-view p:last-child {
                    margin-bottom: 0;
                }
            `}</style>
        </>
    );
}
