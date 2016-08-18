you might wanna read the raw version of this, it looks bad on github!
https://github.com/philwinkel/html-email-dev/blob/master/readme.md


npm install

------------------------------------------------------------------------------------------------------------------------
to develop,
> node devserver
- navigate to your template (eg, /src/emails/index.html)
- server should serve the file, browser sync should be running. save changes to file and it updates in-browser.

if you want to a template engine during development, add the necessary scripts and render during window.onload, etc

------------------------------------------------------------------------------------------------------------------------
to build,
> npm install -g gulp
> gulp

this will go through all the .html files in /src/emails , inline the CSS, and output them to /build

------------------------------------------------------------------------------------------------------------------------
html emails notes

refer to this document for CSS support across various email clients:
https://www.campaignmonitor.com/css/

------------------------------------------------------------------------------------------------------------------------
general tips:

- put alt text on img, add font-styles for alt text styling
- use tables for layout. put most styles on td elements.
- use align attribute on td to align text, instead of text-align styles
- use pixel values for best client support (instead of ems/rems/etc)
- use maximum fixed width of 600px in general. outlook needs a fixed width on something, or it gets blown out.
- then override with media queries and width:100% for mobile devices
- don't use shorthand styles (eg, margin: 0 0 0 0). Use margin-left, margin-right, etc.
    (1 exception - you can use shorthand padding!)
- use both css width and html attribute width, etc
- table elements need border=0, cellpadding=0, cellspacing=0 attribute resets.
- style fonts on td's
- can use align="center" on tables to align content
- can use text css properties on tables to format text within tables
- use padding instead of margin for layout spacing (margin support is limited)
- may have to use bgcolor attribute instead of background-color css style
- add spacing to sides of the table, using left+right padding to the main wrapper table

- if phantom spacing issues, try font-size: 0 on containing cells

- margin: 0  is sometimes applied by client, it will override align=center.
 (in yahoo mail, can use style tag and !important to override)

------------------------------------------------------------------------------------------------------------------------
word preprocessor quirks:

- ignores line height on inline elements, must add them to containing elements
 (find the maximum line height within the containing element, use that height)

- have to use VML to render button styles, check out http://buttons.cm

- can use vendor css property mso-hide: all;


------------------------------------------------------------------------------------------------------------------------
outlook 2013 quirks:

- ignores height of empty cells. So, add &nbsp;
- applies line height to images. So, font-size and line-height must be set to height of image

------------------------------------------------------------------------------------------------------------------------
Outlook.com removes "margin" but not "Margin"
 (is this fixed yet? wtf)

------------------------------------------------------------------------------------------------------------------------
media queries for smaller screens:
- use !important within media queries and other CSS to override inline styles.

- problem: fixed widths cause zoom out (if there are widths > viewport)
- solution: any client that supports media queries will support style tags.
- use 100% width class, within inline style tag, for fixed width tables

override styles up to the inline width of the container.
@media screen and (max-width: 600px) {
    .width-full {
        width: 100% !important;
    }
}

------------------------------------------------------------------------------------------------------------------------
Apple preprocessor changes numbers (phones, etc) into links:

- use style tag to set default color on anchors
    a { color...

- use span with a descendant selector to override default color
    .link a { color...

------------------------------------------------------------------------------------------------------------------------
Some browsers have default SMALLEST font size.
We can use vendor specific properties to override defaults.

ms-text-size-adjust: none;
-webkit-text-size-adjust: none;

------------------------------------------------------------------------------------------------------------------------
target specific outlook versions:

conditional comment can be used to target all versions of outlook:
<!--[if mso]>
    ... outlook styles here
<![endif]-->

conditional comment can target specific versions of outlook:
<!--[if gte mso 12]>
    ... outlook >= version 12 styles here
<![endif]-->

target outlook 12 and 14:
<!--[if gte mso 12 && lt mso 15]>
    ... outlook >= version 12 styles here
<![endif]-->


Outlook version / version number
2000 = 9
2002 = 10
2003 = 11
2007 = 12
2010 = 14
2013 = 15

correct line height in word-rendered emails:
(this only works consistently when applied to table elements)
<!--[if gte mso 12]>
    <style>
        td {
            mso-line-height-rule: exactly;
        }
    </style>
<![endif]-->

conditional for Word or IE:
<!--[if mso|(IE)]>
<![endif]-->

------------------------------------------------------------------------------------------------------------------------
Responsive emails:

- Avoid zoom! Elements must use a width that fits within the viewport, or a max-width to contain it
eg, this makes width flexible up to 600px:
{
    max-width: 600px;
    width: 100%;
}
- Each table and image needs width and max-width (eg, above)
- Note - the above tricks are used for single-column tables

- No way to conditionally adjust font-sizes without media queries

- Can use align="left" to stack / align tables.
- default behavior is to stack (display: block)
- With align="left", they display inline if there is room, or block if not.

- If using align=left to stack, and they are stacking but not centered,
<td style="text-align: center;">
    <div style="display: inline-block;">
        align="left" content here...
    </div>
    <div style="display: inline-block;">
        align="left" content here...
    </div>
</td>

- Inline block can cause spacing issues, try font-size:0 to fix