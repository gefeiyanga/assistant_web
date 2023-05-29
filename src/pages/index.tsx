import dynamic from "next/dynamic";

const Index = dynamic(import("./dynamicindex"), { ssr: false });

export default Index;
