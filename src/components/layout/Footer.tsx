export default function Footer() {
    return (
        <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#dfe1e6] bg-white py-3 z-10 text-xs text-[#5e6c84] text-center">
            Klent Zarsuela.{" "}
            <a
                href="/humans.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
            >
                Crafted by yours truly
            </a>
            .
        </footer>
    );
}
