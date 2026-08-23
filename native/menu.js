import {
    Menu,
    Submenu,
    MenuItem,
    PredefinedMenuItem
} from "@tauri-apps/api/menu"

const initMenu = async (state) => {
    const appMenu = await Submenu.new({
        text: "BlueBook",
        items: [
            await MenuItem.new({
                id: "reload",
                text: "Reload",
                accelerator: "CmdOrCtrl+R",
                action: () => {
                    window.location.reload();
                }
            }),
            await PredefinedMenuItem.new({ item: "Separator" }),
            await PredefinedMenuItem.new({ item: "Quit" }),
        ]
    })

    const fileMenu = await Submenu.new({
        text: "File",
        items: [
            await MenuItem.new({
                id: "new",
                text: "New",
                accelerator: "CmdOrCtrl+T",
                action: () => {
                    state.commands.find(g => g.codename == "file>new").run();
                }
            }),

            await MenuItem.new({
                id: "save",
                text: "Save",
                accelerator: "CmdOrCtrl+S",
                action: () => {
                    state.commands.find(g => g.codename == "file>save").run();
                }
            }),

            await PredefinedMenuItem.new({ item: "Separator" }),

            await MenuItem.new({
                id: "rename",
                text: "Rename file",
                action: () => {
                    state.commands.find(g => g.codename == "file>rename").run();
                }
            }),

            await MenuItem.new({
                id: "reload",
                text: "Reload file",
                action: () => {
                    state.commands.find(g => g.codename == "file>reload").run();
                }
            }),

            await PredefinedMenuItem.new({ item: "Separator" }),

            await MenuItem.new({
                id: "delete",
                text: "Delete file",
                action: () => {
                    state.commands.find(g => g.codename == "file>delete").run();
                }
            }),

            await MenuItem.new({
                id: "restore",
                text: "Restore deleted file",
                action: () => {
                    state.commands.find(g => g.codename == "file>restore").run();
                }
            }),

            await PredefinedMenuItem.new({ item: "Separator" }),

            await MenuItem.new({
                id: "copyURL",
                text: "Copy file URL",
                action: () => {
                    state.commands.find(g => g.codename == "file>copy").run();
                }
            }),

            await Submenu.new({
                text: "Export file",
                items: [
                    await MenuItem.new({
                        id: "exportMD",
                        text: "Export to Markdown",
                        action: () => {
                            state.commands.find(g => g.codename == "file>export>md").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "exportPDF",
                        text: "Export to PDF",
                        action: () => {
                            state.commands.find(g => g.codename == "file>export>pdf").run();
                        }
                    }),
                ]
            }),

            await PredefinedMenuItem.new({ item: "Separator" }),

            await MenuItem.new({
                id: "openExplorer",
                text: "Open File Explorer",
                accelerator: "CmdOrCtrl+E",
                action: () => {
                    state.commands.find(g => g.codename == "open>explorer").run();
                }
            }),

            await MenuItem.new({
                id: "openPicker",
                text: "Open File Picker",
                accelerator: "CmdOrCtrl+O",
                action: () => {
                    state.commands.find(g => g.codename == "open>picker").run();
                }
            }),

            // await PredefinedMenuItem.new({ item: "Separator" }),
        ]
    })

    const editMenu = await Submenu.new({
        text: "Edit",
        items: [
            // undo
            // redo
            await MenuItem.new({
                id: "copy",
                text: "Copy",
                accelerator: "CmdOrCtrl+C",
                action: () => {
                    state.commands.find(g => g.codename == "edit>copy").run();
                }
            }),

            await MenuItem.new({
                id: "paste",
                text: "Paste",
                accelerator: "CmdOrCtrl+V",
                action: () => {
                    state.commands.find(g => g.codename == "edit>paste").run();
                }
            }),

            await PredefinedMenuItem.new({ item: "Separator" }),


            // math
            // link
            // underline
            // bold
            // italic
            // highlight
            // border

            await Submenu.new({
                text: "Format line",
                items: [
                    await MenuItem.new({
                        id: "line_h1",
                        accelerator: "CmdOrCtrl+Shift+A",
                        text: "1st level heading",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>h1").run();
                        }
                    }),

                    await MenuItem.new({
                        id: "line_h2",
                        accelerator: "CmdOrCtrl+Shift+S",
                        text: "2nd level heading",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>h2").run();
                        }
                    }),

                    await MenuItem.new({
                        id: "line_h3",
                        accelerator: "CmdOrCtrl+Shift+D",
                        text: "3rd level heading",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>h3").run();
                        }
                    }),

                    await MenuItem.new({
                        id: "line_h4",
                        accelerator: "CmdOrCtrl+Shift+F",
                        text: "4th level heading",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>h4").run();
                        }
                    }),

                    await MenuItem.new({
                        id: "line_subtitle",
                        accelerator: "CmdOrCtrl+Shift+G",
                        text: "Subtitle",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>subtitle").run();
                        }
                    }),

                    await MenuItem.new({
                        id: "line_center",
                        accelerator: "CmdOrCtrl+Shift+C",
                        text: "Center",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>center").run();
                        }
                    }),

                    await PredefinedMenuItem.new({ item: "Separator" }),

                    await MenuItem.new({
                        id: "line_math",
                        accelerator: "CmdOrCtrl+Shift+M",
                        text: "Math",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>math").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "line_link",
                        accelerator: "CmdOrCtrl+Shift+L",
                        text: "Link",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>link").run();
                        }
                    }),

                    await PredefinedMenuItem.new({ item: "Separator" }),

                    await MenuItem.new({
                        id: "line_underline",
                        accelerator: "CmdOrCtrl+Shift+U",
                        text: "Underline",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>underline").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "line_bold",
                        accelerator: "CmdOrCtrl+Shift+B",
                        text: "Bold",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>bold").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "line_italic",
                        accelerator: "CmdOrCtrl+Shift+I",
                        text: "Italic",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>italic").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "line_highlight",
                        accelerator: "CmdOrCtrl+Shift+H",
                        text: "Highlight",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>highlight").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "line_border",
                        text: "Border",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>border").run();
                        }
                    }),

                    await PredefinedMenuItem.new({ item: "Separator" }),

                    await MenuItem.new({
                        id: "line_remove",
                        accelerator: "CmdOrCtrl+Shift+0",
                        text: "Remove decorations",
                        action: () => {
                            state.commands.find(g => g.codename == "format>line>remove").run();
                        }
                    }),
                ]
            }),

            await Submenu.new({
                text: "Format selection",
                items: [
                    await MenuItem.new({
                        id: "mark_math",
                        accelerator: "CmdOrCtrl+m",
                        text: "Math",
                        action: () => {
                            state.commands.find(g => g.codename == "format>mark>math").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "mark_link",
                        accelerator: "CmdOrCtrl+l",
                        text: "Link",
                        action: () => {
                            state.commands.find(g => g.codename == "format>mark>link").run();
                        }
                    }),

                    await PredefinedMenuItem.new({ item: "Separator" }),

                    await MenuItem.new({
                        id: "mark_underline",
                        accelerator: "CmdOrCtrl+u",
                        text: "Underline",
                        action: () => {
                            state.commands.find(g => g.codename == "format>mark>underline").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "mark_bold",
                        accelerator: "CmdOrCtrl+b",
                        text: "Bold",
                        action: () => {
                            state.commands.find(g => g.codename == "format>mark>bold").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "mark_italic",
                        accelerator: "CmdOrCtrl+i",
                        text: "Italic",
                        action: () => {
                            state.commands.find(g => g.codename == "format>mark>italic").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "mark_highlight",
                        accelerator: "CmdOrCtrl+h",
                        text: "Highlight",
                        action: () => {
                            state.commands.find(g => g.codename == "format>mark>highlight").run();
                        }
                    }),
                    await MenuItem.new({
                        id: "mark_border",
                        text: "Border",
                        action: () => {
                            state.commands.find(g => g.codename == "format>mark>border").run();
                        }
                    }),
                ]
            }),


            // format line
            await MenuItem.new({
                id: "indent",
                text: "Increase indent level",
                accelerator: "Tab",
                action: () => {
                    state.commands.find(g => g.codename == "edit>indent").run();
                }
            }),

            await MenuItem.new({
                id: "unindent",
                text: "Decrease indent level",
                accelerator: "Shift+Tab",
                action: () => {
                    state.commands.find(g => g.codename == "edit>unindent").run();
                }
            }),
        ]
    })

    const menu = await Menu.new({
        items: [
            appMenu,
            fileMenu,
            editMenu
        ]
    })

    console.log("Menu created");
    await menu.setAsAppMenu()
}

export default initMenu;
