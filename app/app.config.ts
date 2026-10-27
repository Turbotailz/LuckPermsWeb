export default defineAppConfig({
  ui: {
    colors: {
      primary: 'lime',
      secondary: 'stone',
      success: 'green',
      info: 'teal',
      warning: 'amber',
      error: 'red',
      neutral: 'stone'
    },
    button: {
      slots: {
        base: 'rounded-full! font-semibold'
      }
    },
    dashboardGroup: {
      base: 'fixed inset-x-0 bottom-0 top-(--ui-header-height) flex overflow-hidden'
    },
    dashboardPanel: {
      slots: {
        root: 'relative flex flex-col min-w-0 min-h-0 lg:not-last:border-e lg:not-last:border-default shrink-0'
      }
    },
    dashboardSidebar: {
      slots: {
        root: 'relative hidden lg:flex flex-col min-h-0 min-w-16 w-(--width) shrink-0'
      }
    },
    contentNavigation: {
      slots: {
        linkTitle: 'whitespace-normal text-pretty'
      }
    },
    pageHero: {
      slots: {
        title: 'text-4xl sm:text-6xl text-pretty tracking-tight font-extrabold text-highlighted',
        description: 'text-lg sm:text-xl text-muted'
      }
    },
    pageSection: {
      slots: {
        title: 'text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-highlighted',
        description: 'text-base sm:text-lg text-muted'
      }
    },
    pageHeader: {
      slots: {
        title: 'text-2xl sm:text-3xl text-pretty tracking-tight font-extrabold text-highlighted',
        description: 'text-base sm:text-lg text-pretty text-muted'
      }
    },
    // Wiki markdown uses # / ## for in-page sections, not the page title
    // (that's UPageHeader). Keep those steps below the header, not above it.
    prose: {
      h1: {
        slots: {
          base: 'text-2xl text-highlighted font-extrabold mt-10 mb-4 scroll-mt-[calc(45px+var(--ui-header-height))] lg:scroll-mt-(--ui-header-height)'
        }
      },
      h2: {
        slots: {
          base: 'relative text-xl text-highlighted font-extrabold mt-8 mb-3 scroll-mt-[calc(48px+45px+var(--ui-header-height))] lg:scroll-mt-[calc(48px+var(--ui-header-height))] [&>a]:rounded-sm [&>a]:outline-primary/25 [&>a]:focus-visible:outline-3 [&>a>code]:border-dashed hover:[&>a>code]:border-primary hover:[&>a>code]:text-primary [&>a>code]:text-lg/6 [&>a>code]:font-extrabold [&>a>code]:transition-colors'
        }
      },
      h3: {
        slots: {
          base: 'relative text-lg text-highlighted font-bold mt-6 mb-2 scroll-mt-[calc(32px+45px+var(--ui-header-height))] lg:scroll-mt-[calc(32px+var(--ui-header-height))] [&>a]:rounded-sm [&>a]:outline-primary/25 [&>a]:focus-visible:outline-3 [&>a>code]:border-dashed hover:[&>a>code]:border-primary hover:[&>a>code]:text-primary [&>a>code]:text-base/6 [&>a>code]:font-bold [&>a>code]:transition-colors'
        }
      },
      h4: {
        slots: {
          base: 'text-base text-highlighted font-semibold mt-6 mb-2 scroll-mt-[calc(24px+45px+var(--ui-header-height))] lg:scroll-mt-[calc(24px+var(--ui-header-height))] [&>a]:rounded-sm [&>a]:outline-primary/25 [&>a]:focus-visible:outline-3'
        }
      },
      pre: {
        slots: {
          base: 'group font-mono text-sm/6 border border-[var(--lp-forest-700)] bg-[var(--lp-forest-950)]! text-[var(--lp-cream)] rounded-2xl px-4 py-3 whitespace-pre-wrap wrap-break-word overflow-x-auto outline-primary/25 focus-visible:outline-3 focus-visible:border-primary **:[.line]:block **:[.line.highlight]:-mx-4 **:[.line.highlight]:px-4 **:[.line.highlight]:bg-white/10!'
        }
      }
    }
  }
})
