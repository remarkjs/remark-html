// TypeScript Version: 3.5

import {Plugin} from 'unified'
import {HastUtilToHtmlOptions} from 'hast-util-to-html'

interface htmlOptions extends HastUtilToHtmlOptions {
  sanitize?: boolean | {[key: string]: any}
}

declare const html: Plugin<[htmlOptions?]>
export = html
