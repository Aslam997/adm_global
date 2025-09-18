import { useNavigate } from "react-router-dom";

export interface HeaderProps {
    title?: string;
    logoText?: string;
    }
    
    
    const Header: React.FC<HeaderProps> = ({
    title = "Avto Olam",
    logoText = "LOGO",
    }) => {

    const navigate = useNavigate();

    return (
    <header className="w-full bg-[#6d6e6f] text-white shadow-sm print:fixed print:top-0 print:left-0 print:right-0">
        <div className="max-w-[1780px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div 
                    className="w-14 h-14 flex items-center cursor-pointer justify-center rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold"
                    onClick={() => navigate("/")}
                    >
                    {logoText}
                </div>
            </div>
        
            <div className="text-center text-lg font-extrabold">{title}</div>

            <div></div>
        
        </div>
    </header>
    );
    }; export default Header