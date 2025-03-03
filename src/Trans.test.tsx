import { render } from "@solidjs/testing-library"
import { createSignal, JSX, ParentComponent } from "solid-js"
import {
  Trans,
  I18nProvider,
  TransRenderProps,
  TransRenderCallbackOrComponent,
  I18nContext,
} from "@lingui/solid"
import { setupI18n } from "@lingui/core"
import { mockConsole } from "@lingui/jest-mocks"
import { TransNoContext } from "./TransNoContext"

describe("Trans component", () => {
  /*
   * Setup context, define helpers
   */
  const i18n = setupI18n({
    locale: "cs",
    messages: {
      cs: {
        "All human beings are born free and equal in dignity and rights.":
          "Všichni lidé rodí se svobodní a sobě rovní co do důstojnosti a práv.",
        "My name is {name}": "Jmenuji se {name}",
        Original: "Původní",
        Updated: "Aktualizovaný",
        "msg.currency": "{value, number, currency}",
        ID: "Translation",
      },
    },
  })

  const renderWithI18n = (node: () => JSX.Element) =>
    render(() => <I18nProvider i18n={i18n}>{node()}</I18nProvider>)
  const text = (node: () => JSX.Element) =>
    renderWithI18n(node).container.textContent
  const html = (node: () => JSX.Element) =>
    renderWithI18n(node).container.innerHTML

  /*
   * Tests
   */

  describe("should log console.error", () => {
    const renderProp: ParentComponent<TransRenderProps> = (props) => (
      <span>render_{props.children}</span>
    )
    const component: ParentComponent<TransRenderProps> = (props) => (
      <span>component_{props.children}</span>
    )
    test.each<{
      description: string
      props: any
      expectedLog: string
      expectedTextContent: string
    }>([
      {
        description:
          "both `render` and `component` are used, and return `render`",
        props: {
          render: renderProp,
          component,
        },
        expectedLog:
          "You can't use both `component` and `render` prop at the same time.",
        expectedTextContent: "render_Some text",
      },
      {
        description:
          "`render` is not of type function, and return `defaultComponent`",
        props: {
          render: "invalid",
        },
        expectedLog:
          "Invalid value supplied to prop `render`. It must be a function, provided invalid",
        expectedTextContent: "default_Some text",
      },
      {
        description: "`component` is not of type function, and return ",
        props: {
          component: "invalid",
        },
        expectedLog:
          "Invalid value supplied to prop `component`. It must be a SolidJS component, provided invalid",
        expectedTextContent: "default_Some text",
      },
    ])("when $description", ({ expectedLog, props, expectedTextContent }) => {
      mockConsole((console) => {
        const { container } = render(() =>
          <I18nProvider
            i18n={i18n}
            defaultComponent={(props) => {
              return <>default_{props.translation}</>
            }}
          >
            <Trans {...props} id="Some text" />
          </I18nProvider>
        )

        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(expectedLog)
        )
        expect(container.textContent).toBe(expectedTextContent)
      })
    })

    it("when there's no i18n context available", () => {
      const originalConsole = console.error
      console.error = jest.fn()

      expect(() => render(() => <Trans id="unknown" />))
        .toThrowErrorMatchingInlineSnapshot(`
        "Trans component was rendered without I18nProvider.
        Attempted to render message: undefined id: unknown. Make sure this component is rendered inside a I18nProvider."
      `)
      expect(() =>
        render(() => <Trans id="unknown" message={"some valid message"} />)
      ).toThrowErrorMatchingInlineSnapshot(`
        "Trans component was rendered without I18nProvider.
        Attempted to render message: some valid message id: unknown. Make sure this component is rendered inside a I18nProvider."
      `)

      console.error = originalConsole
    })

    it("when deprecated string built-ins are used", () => {
      const originalConsole = console.error
      console.error = jest.fn()

      // @ts-expect-error testing the error
      renderWithI18n(() => <Trans render="span" id="Some text" />)
      expect(console.error).toHaveBeenCalled()

      // @ts-expect-error testing the error
      renderWithI18n(() => <Trans render="span" id="Some text" />)
      expect(console.error).toHaveBeenCalledTimes(2)
      console.error = originalConsole
    })
  })

  it("should follow jsx semantics regarding booleans", () => {
    expect(
      html(() =>
        <Trans
          id="unknown"
          message={"foo <0>{0}</0> bar"}
          values={{
            0: false && "lol",
          }}
          components={{
            0: <span />,
          }}
        />
      )
    ).toEqual("foo <span></span> bar")

    expect(
      html(() =>
        <Trans
          id="unknown"
          message={"foo <0>{0}</0> bar"}
          values={{
            0: "lol",
          }}
          components={{
            0: <span />,
          }}
        />
      )
    ).toEqual("foo <span>lol</span> bar")
  })

  it("should render default string", () => {
    expect(text(() => <Trans id="unknown" />)).toEqual("unknown")

    expect(text(() => <Trans id="unknown" message="Not translated yet" />)).toEqual(
      "Not translated yet"
    )

    expect(
      text(() =>
        <Trans
          id="unknown"
          message="Not translated yet, {name}"
          values={{ name: "Dave" }}
        />
      )
    ).toEqual("Not translated yet, Dave")
  })

  it("should render translation", () => {
    const translation = text(() =>
      <Trans id="All human beings are born free and equal in dignity and rights." />
    )

    expect(translation).toEqual(
      "Všichni lidé rodí se svobodní a sobě rovní co do důstojnosti a práv."
    )
  })

  it("should render translation from variable", () => {
    const msg =
      "All human beings are born free and equal in dignity and rights."
    const translation = text(() => <Trans id={msg} />)
    expect(translation).toEqual(
      "Všichni lidé rodí se svobodní a sobě rovní co do důstojnosti a práv."
    )
  })

  it("should render component in variables", () => {
    const translation = html(() =>
      <Trans id="Hello {name}" values={{ name: <strong>John</strong> }} />
    )
    expect(translation).toEqual("Hello <strong>John</strong>")
  })

  it("should render array of components in variables", () => {
    const translation = html(() =>
      <Trans
        id="Hello {name}"
        values={{
          name: [<strong>John</strong>, <strong>!</strong>],
        }}
      />
    )
    expect(translation).toEqual("Hello <strong>John</strong><strong>!</strong>")
  })

  it("should render named component in components", () => {
    const translation = html(() =>
      <Trans
        id="Read <named>the docs</named>"
        components={{ named: <a href="/docs" /> }}
      />
    )
    expect(translation).toEqual(`Read <a href="/docs">the docs</a>`)
  })

  it("should render nested named components in components", () => {
    const translation = html(() =>
      <Trans
        id="Read <link>the <strong>docs</strong></link>"
        components={{ link: <a href="/docs" />, strong: <strong /> }}
      />
    )
    expect(translation).toEqual(
      `Read <a href="/docs">the <strong>docs</strong></a>`
    )
  })

  it("should render components and array components with variable", () => {
    const translation = html(() =>
      <Trans
        id="Read <link>the <strong>docs</strong></link>, {name}"
        components={{ link: <a href="/docs" />, strong: <strong /> }}
        values={{
          name: [<strong>John</strong>, <strong>!</strong>],
        }}
      />
    )
    expect(translation).toEqual(
      `Read <a href="/docs">the <strong>docs</strong></a>, <strong>John</strong><strong>!</strong>`
    )
  })

  it("should render non-named component in components", () => {
    const translation = html(() =>
      <Trans id="Read <0>the docs</0>" components={{ 0: <a href="/docs" /> }} />
    )
    expect(translation).toEqual(`Read <a href="/docs">the docs</a>`)
  })

  it("should render translation inside custom component", () => {
    const Component: ParentComponent = (props) => (
      <p class="lead">{props.children}</p>
    )
    const html1 = html(() => <Trans component={Component} id="Original" />)
    const html2 = html(() =>
      <Trans
        render={(props) => <p class="lead">{props.translation}</p>}
        id="Original"
      />
    )

    expect(html1).toEqual('<p class="lead">Původní</p>')
    expect(html2).toEqual('<p class="lead">Původní</p>')
  })

  it("should render custom format", () => {
    const translation = text(() =>
      <Trans
        id="msg.currency"
        values={{ value: 1 }}
        formats={{
          currency: {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
          },
        }}
      />
    )
    expect(translation).toEqual("1,00 €")
  })

  it("should render plural", () => {
    const render = (count: number) =>
      html(() =>
        <Trans
          id={"tYX0sm"}
          message={
            "{count, plural, =0 {Zero items} one {# item} other {# <0>A lot of them</0>}}"
          }
          values={{
            count,
          }}
          components={{
            0: <a href="/more" />,
          }}
        />
      )

    expect(render(0)).toEqual("Zero items")
    expect(render(1)).toEqual("1 item")
    expect(render(2)).toEqual(`2 <a href="/more">A lot of them</a>`)
  })

  describe("rendering", () => {
    it("should render a text node with no wrapper element", () => {
      const txt = html(() => <Trans id="Some text" />)
      expect(txt).toEqual("Some text")
    })

    it("should render custom element", () => {
      const element = html(() =>
        <Trans
          render={(props) => <h1 id={props.id}>{props.translation}</h1>}
          id="Headline"
        />
      )
      expect(element).toEqual(`<h1 id="Headline">Headline</h1>`)
    })

    it("supports render callback function", () => {
      const spy = jest.fn()
      text(() =>
        <Trans
          id="ID"
          message="Default"
          render={(props) => {
            spy(props)
            return <></>
          }}
        />
      )

      expect(spy).toHaveBeenCalledWith({
        id: "ID",
        message: "Default",
        translation: "Translation",
        children: "Translation",
      })
    })

    it("should take defaultComponent prop with a custom component", () => {
      const ComponentFC: ParentComponent<TransRenderProps> = (
        props
      ) => {
        return <div>{props.children}</div>
      }
      const span = render(() =>
        <I18nProvider i18n={i18n} defaultComponent={ComponentFC}>
          <Trans id="Some text" />
        </I18nProvider>
      ).container.innerHTML
      expect(span).toEqual(`<div>Some text</div>`)
    })

    test.each<TransRenderCallbackOrComponent>([
      { component: null },
      { render: null },
    ])(
      "should ignore defaultComponent when `component` or `render` is null",
      (props) => {
        const ComponentFC: ParentComponent<TransRenderProps> = (
          props
        ) => {
          return <div>{props.children}</div>
        }
        const translation = render(() =>
          <I18nProvider i18n={i18n} defaultComponent={ComponentFC}>
            <Trans id="Some text" {...props} />
          </I18nProvider>
        ).container.innerHTML
        expect(translation).toEqual("Some text")
      }
    )
  })

  describe("component prop rendering", () => {
    it("should render function component as simple prop", () => {
      const propsSpy = jest.fn()
      const ComponentFC: ParentComponent<TransRenderProps> = (
        props
      ) => {
        propsSpy(props)
        const [state] = createSignal("value")
        return <div id={props.id}>{state()}</div>
      }

      const element = html(() => <Trans component={ComponentFC} id="Headline" />)
      expect(element).toEqual(`<div id="Headline">value</div>`)
      expect(propsSpy).toHaveBeenCalledWith({
        id: "Headline",
        message: undefined,
        translation: "Headline",
        children: "Headline",
      })
    })
  })

  describe("I18nProvider defaultComponent accepts render-like props", () => {
    const DefaultComponent: ParentComponent<TransRenderProps> = (
      props
    ) => (
      <>
        <div data-testid="children">{props.children}</div>
        {props.id && <div data-testid="id">{props.id}</div>}
        {props.message && <div data-testid="message">{props.message}</div>}
        {props.translation && (
          <div data-testid="translation">{props.translation}</div>
        )}
      </>
    )

    it("should render defaultComponent with Trans props", () => {
      const markup = render(() =>
        <I18nProvider i18n={i18n} defaultComponent={DefaultComponent}>
          <Trans id="ID" message="Some message" />
        </I18nProvider>
      )

      expect(markup.queryByTestId("id")?.innerHTML).toEqual("ID")
      expect(markup.queryByTestId("message")?.innerHTML).toEqual("Some message")
      expect(markup.queryByTestId("translation")?.innerHTML).toEqual(
        "Translation"
      )
    })

    describe("TransNoContext", () => {
      it("Should render without provider/context", () => {
        const lingui: I18nContext = {
          i18n: () => i18n,
          _: i18n._,
          defaultComponent: () => undefined
        }
        const translation = render(() =>
          <TransNoContext
            id="All human beings are born free and equal in dignity and rights."
            lingui={lingui}
          />
        ).container.textContent

        expect(translation).toEqual(
          "Všichni lidé rodí se svobodní a sobě rovní co do důstojnosti a práv."
        )
      })
    })
  })
})
