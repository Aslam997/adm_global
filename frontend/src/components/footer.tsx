export interface FooterProps {
    companyLabel?: string;
    contact?: string;
    }
    
    
    const Footer: React.FC<FooterProps> = ({
        companyLabel = "AvtoOlam Inc. — Confidential",
    }) => {
    return (
    <footer className="w-full bg-[#6d6e6f] text-white shadow-inner print:fixed print:bottom-0 print:left-0 print:right-0">
        <div className="max-w-[1780px] mx-auto px-6 py-6 flex items-center justify-between text-xs ">
            <div>{companyLabel}</div>
            <div className="flex items-center gap-4">
            </div>
        </div>
        <div className="border-t border-slate-100" />
    </footer>
    );
    }; export default Footer