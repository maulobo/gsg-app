/**
 * Hero UI Components Examples
 * 
 * Este archivo muestra ejemplos de uso de los componentes de Hero UI
 * Documentación: https://www.heroui.com/docs/components
 */

'use client'

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Avatar,
  Divider,
  Spinner,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react'

export function HeroUIExamples() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold">Hero UI Components</h1>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button color="default">Default</Button>
          <Button color="primary">Primary</Button>
          <Button color="secondary">Secondary</Button>
          <Button color="success">Success</Button>
          <Button color="warning">Warning</Button>
          <Button color="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="bordered">Bordered</Button>
          <Button variant="flat">Flat</Button>
          <Button isLoading>Loading</Button>
          <Button isDisabled>Disabled</Button>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Card Title</h3>
            </CardHeader>
            <CardBody>
              <p>This is a basic card component from Hero UI.</p>
            </CardBody>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card isPressable>
            <CardHeader>
              <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
              <div className="ml-3">
                <p className="font-semibold">User Name</p>
                <p className="text-sm text-gray-500">@username</p>
              </div>
            </CardHeader>
            <CardBody>
              <p>This card is pressable (clickable).</p>
            </CardBody>
          </Card>

          <Card shadow="lg">
            <CardHeader>
              <Chip color="success" variant="flat">
                Active
              </Chip>
            </CardHeader>
            <CardBody>
              <p>Card with shadow and chip.</p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Form Inputs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Form Inputs</h2>
        <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Name" placeholder="Enter your name" />
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            variant="bordered"
          />
          <Select label="Select an option" placeholder="Choose one">
            <SelectItem key="option1">Option 1</SelectItem>
            <SelectItem key="option2">Option 2</SelectItem>
            <SelectItem key="option3">Option 3</SelectItem>
          </Select>
          <Textarea
            label="Description"
            placeholder="Enter your description"
            className="col-span-2"
          />
        </div>
      </section>

      {/* Modal */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Modal</h2>
        <Button onPress={onOpen}>Open Modal</Button>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Modal Title</ModalHeader>
                <ModalBody>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Nullam pulvinar risus non risus hendrerit venenatis.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Close
                  </Button>
                  <Button color="primary" onPress={onClose}>
                    Action
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </section>

      {/* Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Table</h2>
        <Table aria-label="Example table">
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>ROLE</TableColumn>
            <TableColumn>STATUS</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow key="1">
              <TableCell>Tony Reichert</TableCell>
              <TableCell>CEO</TableCell>
              <TableCell>
                <Chip color="success" size="sm" variant="flat">
                  Active
                </Chip>
              </TableCell>
            </TableRow>
            <TableRow key="2">
              <TableCell>Zoey Lang</TableCell>
              <TableCell>Technical Lead</TableCell>
              <TableCell>
                <Chip color="warning" size="sm" variant="flat">
                  Paused
                </Chip>
              </TableCell>
            </TableRow>
            <TableRow key="3">
              <TableCell>Jane Fisher</TableCell>
              <TableCell>Senior Developer</TableCell>
              <TableCell>
                <Chip color="success" size="sm" variant="flat">
                  Active
                </Chip>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* Other Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Other Components</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Spinner color="primary" />
          <Spinner color="success" size="lg" />
          
          <Divider orientation="vertical" className="h-10" />
          
          <Tooltip content="I am a tooltip">
            <Button variant="flat">Hover me</Button>
          </Tooltip>
          
          <Divider orientation="vertical" className="h-10" />
          
          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered">Open Dropdown</Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="new">New file</DropdownItem>
              <DropdownItem key="copy">Copy link</DropdownItem>
              <DropdownItem key="edit">Edit file</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger">
                Delete file
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
          <Avatar
            src="https://i.pravatar.cc/150?u=a04258114e29026702d"
            size="lg"
          />
          
          <Chip color="primary" variant="dot">
            New
          </Chip>
        </div>
      </section>
    </div>
  )
}
