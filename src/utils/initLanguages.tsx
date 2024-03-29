import * as languages from "./languages";
import hljs from "highlight.js/lib/core";

const InitLanguages = () => {
  hljs.registerLanguage("javascript", languages?.javascript);
  hljs.registerLanguage("c", languages?.c);
  hljs.registerLanguage("cpp", languages?.cpp);
  hljs.registerLanguage("csharp", languages?.csharp);
  hljs.registerLanguage("css", languages?.css);
  hljs.registerLanguage("go", languages?.go);
  hljs.registerLanguage("java", languages?.java);
  hljs.registerLanguage("json", languages?.json);
  hljs.registerLanguage("kotlin", languages?.kotlin);
  hljs.registerLanguage("latex", languages?.latex);
  hljs.registerLanguage("less", languages?.less);
  hljs.registerLanguage("django", languages?.django);
  hljs.registerLanguage("markdown", languages?.markdown);
  hljs.registerLanguage("matlab", languages?.matlab);
  hljs.registerLanguage("php", languages?.php);
  hljs.registerLanguage("python", languages?.python);
  hljs.registerLanguage("nginx", languages?.nginx);
  hljs.registerLanguage("lua", languages?.lua);
  hljs.registerLanguage("ruby", languages?.ruby);
  hljs.registerLanguage("rust", languages?.rust);
  hljs.registerLanguage("scss", languages?.scss);
  hljs.registerLanguage("sql", languages?.sql);
  hljs.registerLanguage("stylus", languages?.stylus);
  hljs.registerLanguage("shell", languages?.shell);
  hljs.registerLanguage("swift", languages?.swift);
  hljs.registerLanguage("vim", languages?.vim);
  hljs.registerLanguage("xml", languages?.xml);
  hljs.registerLanguage("yaml", languages?.yaml);
};
export default InitLanguages;
