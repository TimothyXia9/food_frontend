import "react";

declare module "react" {
	interface HTMLAttributes {
		jsx?: boolean;
		global?: boolean;
	}
}

declare module "styled-jsx/style" {
	import { ComponentType } from "react";

	interface StyleProps {
		id?: string;
		dynamic?: string[];
		children?: string;
	}

	const Style: ComponentType<StyleProps>;
	export default Style;
}
