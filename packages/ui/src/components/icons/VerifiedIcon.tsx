import { chakra } from "@chakra-ui/react"
import { SVGProps } from "react"
const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M21.178 9.637c-.356-.365-.722-.75-.862-1.078-.141-.328-.132-.815-.141-1.312-.01-.91-.028-1.95-.75-2.672-.722-.722-1.762-.74-2.672-.75-.497-.01-1.003-.019-1.312-.14-.31-.123-.713-.507-1.079-.863C13.716 2.203 12.976 1.5 12 1.5c-.975 0-1.716.703-2.363 1.322-.365.356-.75.722-1.078.862-.328.141-.815.132-1.312.141-.91.01-1.95.028-2.672.75-.722.722-.74 1.763-.75 2.672-.01.497-.019 1.003-.14 1.312-.123.31-.507.713-.863 1.079C2.203 10.284 1.5 11.024 1.5 12c0 .975.703 1.716 1.322 2.363.356.365.722.75.862 1.078.141.328.132.815.141 1.312.01.91.028 1.95.75 2.672.722.722 1.763.74 2.672.75.497.01 1.003.019 1.312.14.31.122.713.507 1.079.863.646.619 1.387 1.322 2.362 1.322.975 0 1.716-.703 2.363-1.322.365-.356.75-.722 1.078-.862.328-.141.815-.132 1.312-.141.91-.01 1.95-.028 2.672-.75.722-.722.74-1.762.75-2.672.01-.497.019-1.003.14-1.312.122-.31.507-.713.863-1.079.619-.646 1.322-1.387 1.322-2.362 0-.975-.703-1.716-1.322-2.363Zm-4.537.657-5.494 5.25a.76.76 0 0 1-1.04 0l-2.748-2.625a.75.75 0 1 1 1.032-1.088l2.23 2.128 4.988-4.753a.75.75 0 0 1 1.032 1.088Z"
      fill="currentColor"
    />
  </svg>
)
export default chakra(SvgComponent)
