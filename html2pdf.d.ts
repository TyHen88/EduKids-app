// html2pdf.js ships no types. Minimal ambient declaration for the chained API
// we use: html2pdf().set(opts).from(el).save().
declare module "html2pdf.js" {
  interface Html2Pdf {
    set(opts: Record<string, unknown>): Html2Pdf;
    from(element: HTMLElement): Html2Pdf;
    save(): Promise<void>;
  }
  const html2pdf: () => Html2Pdf;
  export default html2pdf;
}
