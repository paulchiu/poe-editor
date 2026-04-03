const GREEN = '\x1b[1;32m'
const WHITE = '\x1b[1;37m'
const RESET = '\x1b[0m'

export function neofetch(): string {
  const art = [
    '         ___       ',
    '        (o o)      ',
    '       (  V  )     ',
    '       /|   |\\     ',
    '      / |   | \\    ',
    '         m m       ',
    '                   ',
    '                   ',
    '                   ',
    '                   ',
    '                   ',
  ]

  const info = [
    `${GREEN}edgar@poe-editor${RESET}`,
    `${GREEN}----------------${RESET}`,
    `${WHITE}OS:${RESET} PoeOS 6.6.6`,
    `${WHITE}Host:${RESET} poe-editor`,
    `${WHITE}Kernel:${RESET} 6.6.6-poe`,
    `${WHITE}Shell:${RESET} bash 5.2`,
    `${WHITE}Editor:${RESET} vim (escaped)`,
    `${WHITE}Theme:${RESET} Matrix Green`,
    `${WHITE}Uptime:${RESET} since you typed :q`,
    `${WHITE}Packages:${RESET} 0 (npm)`,
    `${WHITE}Memory:${RESET} 640K (ought to be enough)`,
  ]

  const lines = art.map((artLine, i) => {
    return `${GREEN}${artLine}${RESET}${info[i]}`
  })

  return lines.join('\n')
}
