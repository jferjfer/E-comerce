// Declaración de tipos para el widget de Addi (custom element)
declare namespace JSX {
  interface IntrinsicElements {
    'addi-widget': {
      price: string;
      'ally-slug': string;
      'custom-widget-styles'?: string;
    };
  }
}
