# frozen_string_literal: true

class Tree::Strategy::ComparePodd::DataMartTableSerializer < Tree::Strategy::DataMartTableSerializer
  attributes :children

  def text
    @object.tech_name.upcase
  end

  def load?
    @load ||= true
  end

  def opened?
    false
  end

  def type
    "attr_circle_#{@object.compare_podd_status.to_s}".to_sym
  end

  def children
    children_hash
  end

  protected

  def element_serializer
    Tree::Strategy::ComparePodd::DataAttributeSerializer
  end
end
