/**
 * Status.java — mostrador estilo código Java (builder) para Amazfit T-Rex 3 (480x480, Zepp OS)
 *
 *   1  @Scheduled("17:56")
 *   2  Status.builder()
 *   3    .date("qua 18/11")
 *   4    .steps(3432)
 *   5    .heartRate(64)
 *   6    .kcal(150)
 *   7    .distanceKm(2.52)
 *   8    .sleep("7h32m")     (null sem registro de sono)
 *   9    .build();
 */
import { createWidget, widget, align, prop, text_style } from '@zos/ui'
import { Time, Step, HeartRate, Calorie, Distance, Sleep } from '@zos/sensor'
import { connectStatus } from '@zos/ble'

// ---------- tema (cores de IDE escura) ----------
const C = {
  annotation: 0xbbb529, // @Scheduled
  method: 0xffc66d, // builder, steps, ...
  str: 0x6a8759, // strings
  num: 0x6897bb, // números
  kw: 0xcc7832, // ; e null
  text: 0xa9b7c6, // Status . ( )
  gutter: 0x444441, // números de linha
  muted: 0x5f5e5a, // barra de status
  classIcon: 0x3d7ab8, // ícone "c" da aba
  tabBg: 0x1a1a1a,
  white: 0xffffff,
  off: 0x444441 // BT desconectado
}

// ---------- tipografia / grade ----------
// JetBrains Mono: avanço de 600/1000 em por caractere → tokens posicionados por coluna.
const FONT = 'fonts/JetBrainsMono-Subset.ttf'
const ADV = 0.6

const CODE_X = 96
const GUTTER_X = 42
const GUTTER_W = 40
const GUTTER_SIZE = 17

const TOP = 64
const TIME_SIZE = 32
const TIME_H = 50
const SIZE = 24
const LINE_H = 37

const DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'] // Time.getDay(): 1 = segunda ... 7 = domingo
const pad = (n) => String(n).padStart(2, '0')
// minutos de sono → "7h32m"; null quando o relógio não registrou sono
const sleepText = (min) => (min > 0 ? `${Math.floor(min / 60)}h${pad(min % 60)}m` : null)
const sleepMinutes = (s) => {
  try {
    return (s.getInfo() || {}).totalTime || 0
  } catch (e) {
    return 0 // sem permissão ou sem dado
  }
}

function text(props) {
  return createWidget(widget.TEXT, {
    font: FONT,
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
    ...props
  })
}

/**
 * Uma linha de código: tokens {text, color, size?} lado a lado.
 * Cada token pode ter tamanho próprio (usado na hora, que é maior).
 */
class CodeLine {
  constructor(n, y, h, size, tokens) {
    this.y = y
    this.h = h
    this.size = size
    this.tokens = tokens

    text({
      x: GUTTER_X,
      y,
      w: GUTTER_W,
      h,
      text: String(n),
      color: C.gutter,
      text_size: GUTTER_SIZE,
      align_h: align.RIGHT
    })

    this.widgets = tokens.map((t) =>
      text({ x: CODE_X, y, w: 10, h, text: t.text, color: t.color, text_size: t.size || size })
    )
    this.layout()
  }

  set(i, value, color) {
    const t = this.tokens[i]
    if (t.text === value && (color === undefined || t.color === color)) return
    t.text = value
    if (color !== undefined) t.color = color
    this.layout()
  }

  layout() {
    let x = CODE_X
    this.tokens.forEach((t, i) => {
      const size = t.size || this.size
      const w = t.text.length * size * ADV
      this.widgets[i].setProperty(prop.MORE, {
        x: Math.round(x),
        y: this.y,
        w: Math.ceil(w) + size, // folga pra nunca entrar em modo de rolagem
        h: this.h,
        text: t.text,
        color: t.color
      })
      x += w
    })
  }
}

/** Linha `  .metodo(valor)` */
function call(n, y, method, value, color) {
  return new CodeLine(n, y, LINE_H, SIZE, [
    { text: '  .', color: C.text },
    { text: method, color: C.method },
    { text: '(', color: C.text },
    { text: value, color },
    { text: ')', color: C.text }
  ])
}

WatchFace({
  build() {
    // ---------- sensores ----------
    this.time = new Time()
    this.step = new Step()
    this.hr = new HeartRate()
    this.cal = new Calorie()
    this.dist = new Distance()
    this.sleep = new Sleep()

    // ---------- aba "Status.java" ----------
    const tabSize = 17
    const tabCw = tabSize * ADV
    const tabLabel = ' Status.java'
    const iconD = 16
    const tabPad = 13
    const tabW = tabPad * 2 + iconD + Math.round(tabLabel.length * tabCw)
    const closeW = 24
    const tabX = Math.round(240 - (tabW + 6 + closeW) / 2)
    const tabY = 24
    const tabH = 30

    createWidget(widget.FILL_RECT, { x: tabX, y: tabY, w: tabW, h: tabH, color: C.tabBg })
    createWidget(widget.FILL_RECT, { x: tabX, y: tabY, w: tabW, h: 3, color: C.kw })
    createWidget(widget.CIRCLE, {
      center_x: tabX + tabPad + iconD / 2,
      center_y: tabY + 2 + tabH / 2,
      radius: iconD / 2,
      color: C.classIcon
    })
    text({
      x: tabX + tabPad,
      y: tabY + 2,
      w: iconD,
      h: tabH,
      text: 'c',
      color: C.white,
      text_size: 13,
      align_h: align.CENTER_H
    })
    text({
      x: tabX + tabPad + iconD,
      y: tabY + 2,
      w: Math.ceil(tabLabel.length * tabCw) + tabSize,
      h: tabH,
      text: tabLabel,
      color: C.text,
      text_size: tabSize
    })
    text({ x: tabX + tabW + 6, y: tabY + 2, w: closeW, h: tabH, text: '×', color: C.gutter, text_size: tabSize, align_h: align.CENTER_H })

    // ---------- código ----------
    let y = TOP
    this.lTime = new CodeLine(1, y, TIME_H, SIZE, [
      { text: '@Scheduled', color: C.annotation },
      { text: '(', color: C.text },
      { text: '"00:00"', color: C.str, size: TIME_SIZE },
      { text: ')', color: C.text }
    ])
    y += TIME_H
    new CodeLine(2, y, LINE_H, SIZE, [
      { text: 'Status.', color: C.text },
      { text: 'builder', color: C.method },
      { text: '()', color: C.text }
    ])
    y += LINE_H
    this.lDate = call(3, y, 'date', '""', C.str)
    y += LINE_H
    this.lSteps = call(4, y, 'steps', '0', C.num)
    y += LINE_H
    this.lHr = call(5, y, 'heartRate', 'null', C.kw)
    y += LINE_H
    this.lKcal = call(6, y, 'kcal', '0', C.num)
    y += LINE_H
    this.lDist = call(7, y, 'distanceKm', '0.00', C.num)
    y += LINE_H
    this.lSleep = call(8, y, 'sleep', 'null', C.kw)
    y += LINE_H
    new CodeLine(9, y, LINE_H, SIZE, [
      { text: '  .', color: C.text },
      { text: 'build', color: C.method },
      { text: '()', color: C.text },
      { text: ';', color: C.kw }
    ])

    // ---------- barra de status ----------
    const stSize = 15
    const stCw = stSize * ADV
    const stRest = ' BT  ·  Java 21  ·  Ln 9'
    const stX = Math.round(240 - ((1 + stRest.length) * stCw) / 2)
    const stY = 418
    this.btDot = text({ x: stX, y: stY, w: 20, h: 24, text: '●', color: C.off, text_size: stSize })
    text({
      x: stX + Math.round(stCw),
      y: stY,
      w: Math.ceil(stRest.length * stCw) + stSize,
      h: 24,
      text: stRest,
      color: C.muted,
      text_size: stSize
    })

    // ---------- atualização ----------
    this.updateTime = () => {
      const t = this.time
      this.lTime.set(2, `"${pad(t.getHours())}:${pad(t.getMinutes())}"`)
      this.lDate.set(3, `"${DAYS[t.getDay() - 1] || ''} ${pad(t.getDate())}/${pad(t.getMonth())}"`)
      let bt = false
      try {
        bt = !!connectStatus()
      } catch (e) {}
      this.btDot.setProperty(prop.MORE, { color: bt ? C.str : C.off })
    }
    this.updateSteps = () => this.lSteps.set(3, String(this.step.getCurrent()))
    this.updateHr = () => {
      const v = this.hr.getLast()
      if (v > 0) this.lHr.set(3, String(v), C.num)
      else this.lHr.set(3, 'null', C.kw)
    }
    this.updateKcal = () => this.lKcal.set(3, String(Math.round(this.cal.getCurrent())))
    this.updateDist = () => {
      const meters = this.dist.getCurrent() // em metros
      this.lDist.set(3, (meters / 1000).toFixed(2))
    }
    this.updateSleep = () => {
      const s = sleepText(sleepMinutes(this.sleep))
      if (s) this.lSleep.set(3, `"${s}"`, C.str)
      else this.lSleep.set(3, 'null', C.kw)
    }
    this.updateAll = () => {
      this.updateTime()
      this.updateSteps()
      this.updateHr()
      this.updateKcal()
      this.updateDist()
      this.updateSleep()
    }

    // sono não tem evento de mudança (o sistema recalcula a cada ~30 min): lê a cada minuto
    this.time.onPerMinute(() => {
      this.updateTime()
      this.updateSleep()
    })
    this.step.onChange(this.updateSteps)
    this.hr.onLastChange(this.updateHr)
    this.cal.onChange(this.updateKcal)
    this.dist.onChange(this.updateDist)

    // ao acordar a tela, garante tudo atualizado
    createWidget(widget.WIDGET_DELEGATE, { resume_call: this.updateAll })

    this.updateAll()
  },

  onDestroy() {
    this.step && this.step.offChange(this.updateSteps)
    this.hr && this.hr.offLastChange(this.updateHr)
    this.cal && this.cal.offChange(this.updateKcal)
    this.dist && this.dist.offChange(this.updateDist)
  }
})
